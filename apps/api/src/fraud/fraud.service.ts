import { Injectable, OnModuleInit } from '@nestjs/common';
import { FraudJobStatus, FraudJobType, VerificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  fraudAnomalyAlertsTotal,
  fraudQueueDepthGauge,
  fraudRiskIndexGauge,
} from '../metrics/prometheus.metrics';

@Injectable()
export class FraudService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.refreshQueueDepthMetric();
    const latest = await this.prisma.fraudAnomalySnapshot.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    if (latest) {
      fraudRiskIndexGauge.set(latest.riskIndex);
    }
  }

  async checkRapidSignatures(ipAddress: string) {
    const rule = await this.prisma.fraudRule.findUnique({
      where: { key: 'rapid_signatures_per_ip' },
    });
    const minuteAgo = new Date(Date.now() - 60_000);
    const count = await this.prisma.signature.count({
      where: { ipAddress, createdAt: { gte: minuteAgo } },
    });
    const threshold = rule?.threshold ?? 5;
    return { suspicious: count >= threshold, count, threshold };
  }

  async flagFraud(userId: string, details: string) {
    await this.prisma.verificationLog.create({
      data: { userId, type: VerificationType.FRAUD, delta: -50, details },
    });
  }

  async listRules() {
    const existing = await this.prisma.fraudRule.count();
    if (existing === 0) {
      await this.prisma.fraudRule.createMany({
        data: [
          {
            key: 'rapid_signatures_per_ip',
            description: 'Maximum signatures from same IP per minute',
            threshold: 5,
            penalty: 50,
          },
          {
            key: 'duplicate_device_reuse',
            description: 'Repeated device use across many signatures',
            threshold: 3,
            penalty: 30,
          },
          {
            key: 'high_velocity_petition',
            description: 'Unusual burst signatures on one petition',
            threshold: 25,
            penalty: 20,
          },
        ],
      });
    }
    return this.prisma.fraudRule.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async updateRule(
    key: string,
    data: { threshold?: number; penalty?: number; enabled?: boolean },
  ) {
    return this.prisma.fraudRule.update({
      where: { key },
      data,
    });
  }

  async logFraudEvent(input: {
    userId?: string;
    petitionId?: string;
    ipAddress?: string;
    deviceId?: string;
    ruleKey: string;
    details: string;
    riskPoints: number;
  }) {
    return this.prisma.fraudEvent.create({ data: input });
  }

  async getAnalytics() {
    const [latestSnapshots, recentEvents, ruleCounts] = await Promise.all([
      this.prisma.fraudAnomalySnapshot.findMany({
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      this.prisma.fraudEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.fraudEvent.groupBy({
        by: ['ruleKey'],
        _count: { _all: true },
        orderBy: { _count: { ruleKey: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      latestSnapshots,
      recentEvents,
      topRules: ruleCounts.map((entry) => ({
        ruleKey: entry.ruleKey,
        count: entry._count._all,
      })),
    };
  }

  async runAnomalyScan() {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSignatures = await this.prisma.signature.count({
      where: { createdAt: { gte: hourAgo } },
    });
    const ipClusters = await this.prisma.signature.groupBy({
      by: ['ipAddress'],
      _count: { _all: true },
      where: { createdAt: { gte: hourAgo }, ipAddress: { not: null } },
    });
    const deviceClusters = await this.prisma.signature.groupBy({
      by: ['deviceId'],
      _count: { _all: true },
      where: { createdAt: { gte: hourAgo }, deviceId: { not: null } },
    });

    const suspiciousIps = ipClusters.filter((entry) => entry._count._all >= 5);
    const suspiciousSignatures = suspiciousIps.reduce(
      (sum, entry) => sum + entry._count._all,
      0,
    );
    const riskIndex =
      recentSignatures === 0 ? 0 : suspiciousSignatures / recentSignatures;

    const snapshot = await this.prisma.fraudAnomalySnapshot.create({
      data: {
        windowStart: hourAgo,
        windowEnd: new Date(),
        totalSignatures: recentSignatures,
        suspiciousSignatures,
        uniqueIps: ipClusters.length,
        uniqueDevices: deviceClusters.length,
        riskIndex,
      },
    });

    fraudRiskIndexGauge.set(snapshot.riskIndex);
    const alertThreshold = Number(
      process.env.FRAUD_RISK_ALERT_THRESHOLD ?? '0.35',
    );
    if (snapshot.riskIndex > alertThreshold) {
      fraudAnomalyAlertsTotal.inc();
    }

    return {
      snapshot,
      suspiciousIpCount: suspiciousIps.length,
    };
  }

  async enqueueAnomalyScan(payload?: string) {
    const job = await this.prisma.fraudJob.create({
      data: {
        type: FraudJobType.ANOMALY_SCAN,
        status: FraudJobStatus.QUEUED,
        payload,
      },
    });
    await this.refreshQueueDepthMetric();
    return job;
  }

  async processNextQueuedJob() {
    const job = await this.prisma.fraudJob.findFirst({
      where: { status: FraudJobStatus.QUEUED },
      orderBy: { createdAt: 'asc' },
    });
    if (!job) return null;

    await this.prisma.fraudJob.update({
      where: { id: job.id },
      data: {
        status: FraudJobStatus.PROCESSING,
        startedAt: new Date(),
        attempts: { increment: 1 },
      },
    });
    await this.refreshQueueDepthMetric();

    try {
      if (job.type === FraudJobType.ANOMALY_SCAN) {
        await this.runAnomalyScan();
      }
      const updated = await this.prisma.fraudJob.update({
        where: { id: job.id },
        data: {
          status: FraudJobStatus.COMPLETED,
          completedAt: new Date(),
          error: null,
        },
      });
      await this.refreshQueueDepthMetric();
      return updated;
    } catch (error) {
      const failed = await this.prisma.fraudJob.update({
        where: { id: job.id },
        data: {
          status: FraudJobStatus.FAILED,
          completedAt: new Date(),
          error: error instanceof Error ? error.message : 'unknown error',
        },
      });
      await this.refreshQueueDepthMetric();
      return failed;
    }
  }

  private async refreshQueueDepthMetric() {
    const depth = await this.prisma.fraudJob.count({
      where: { status: FraudJobStatus.QUEUED },
    });
    fraudQueueDepthGauge.set(depth);
  }

  async getMetrics() {
    const [jobCounts, recentSnapshots, recentEvents] = await Promise.all([
      this.prisma.fraudJob.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.fraudAnomalySnapshot.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      this.prisma.fraudEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const queued = jobCounts.find((j) => j.status === FraudJobStatus.QUEUED);
    const failed = jobCounts.find((j) => j.status === FraudJobStatus.FAILED);
    const latestRisk = recentSnapshots[0]?.riskIndex ?? 0;

    return {
      queueDepth: queued?._count._all ?? 0,
      failedJobs: failed?._count._all ?? 0,
      latestRiskIndex: latestRisk,
      alertLevel:
        latestRisk > 0.4 ? 'high' : latestRisk > 0.2 ? 'elevated' : 'normal',
      recentSnapshots,
      recentEvents,
    };
  }

  async evaluateSignatureRisk(input: {
    petitionId: string;
    userId?: string;
    ipAddress: string;
    deviceId?: string;
  }) {
    const [rapidResult, duplicateDeviceRule] = await Promise.all([
      this.checkRapidSignatures(input.ipAddress),
      this.prisma.fraudRule.findUnique({
        where: { key: 'duplicate_device_reuse' },
      }),
    ]);

    let riskPoints = 0;
    const reasons: string[] = [];
    if (rapidResult.suspicious) {
      riskPoints += 50;
      reasons.push('rapid_signatures_per_ip');
    }

    if (input.deviceId && duplicateDeviceRule?.enabled) {
      const reuseCount = await this.prisma.signature.count({
        where: { deviceId: input.deviceId },
      });
      if (reuseCount >= duplicateDeviceRule.threshold) {
        riskPoints += duplicateDeviceRule.penalty;
        reasons.push('duplicate_device_reuse');
      }
    }

    return {
      riskPoints,
      reasons,
      captchaRequired: riskPoints >= 50,
      rapidResult,
    };
  }
}
