import { Counter, Gauge, Registry, collectDefaultMetrics } from 'prom-client';

export const metricsRegister = new Registry();

collectDefaultMetrics({
  register: metricsRegister,
  prefix: 'vlv_api_',
});

export const fraudRiskIndexGauge = new Gauge({
  name: 'vlv_fraud_risk_index',
  help: 'Latest fraud anomaly scan risk index (0–1)',
  registers: [metricsRegister],
});

export const fraudQueueDepthGauge = new Gauge({
  name: 'vlv_fraud_queue_depth',
  help: 'Number of fraud jobs in QUEUED state',
  registers: [metricsRegister],
});

export const fraudAnomalyAlertsTotal = new Counter({
  name: 'vlv_fraud_anomaly_alerts_total',
  help: 'Count of anomaly snapshots exceeding drift alert threshold',
  registers: [metricsRegister],
});

export const captchaVerificationsTotal = new Counter({
  name: 'vlv_captcha_verifications_total',
  help: 'CAPTCHA verification outcomes by provider and result',
  labelNames: ['provider', 'result'],
  registers: [metricsRegister],
});

export const signaturesCreatedTotal = new Counter({
  name: 'vlv_signatures_created_total',
  help: 'Signatures successfully persisted',
  registers: [metricsRegister],
});
