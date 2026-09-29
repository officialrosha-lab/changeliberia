import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Institution, ConstituencyReportPeriod } from '@prisma/client';
import { ConstituencyFeedService } from './constituency-feed.service';

const PERIOD_LABELS: Record<ConstituencyReportPeriod, string> = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUAL: 'Annual',
};

/**
 * Generates PDF/CSV constituency reports for verified lawmakers — mirrors
 * `ImpactAreaReportService`'s pdfkit conventions. Fed entirely by
 * `ConstituencyFeedService.getConstituencySummary`, scoped to the report's
 * exact `periodStart`/`periodEnd` window, so the numbers in a report always
 * match what the live dashboard would show for that same range.
 */
@Injectable()
export class ConstituencyReportGeneratorService {
  constructor(private readonly constituencyFeed: ConstituencyFeedService) {}

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  private async gatherReportData(
    institution: Institution,
    periodStart: Date,
    periodEnd: Date,
  ) {
    const summary = await this.constituencyFeed.getConstituencySummary(
      institution,
      { start: periodStart, end: periodEnd },
    );
    return { institution, summary };
  }

  async generateCsv(
    institution: Institution,
    period: ConstituencyReportPeriod,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<string> {
    const { summary } = await this.gatherReportData(
      institution,
      periodStart,
      periodEnd,
    );
    const csvEscape = (val: string | number | null | undefined) =>
      `"${String(val ?? '').replace(/"/g, '""')}"`;

    const lines: string[] = [];
    lines.push(['Section', 'Field', 'Value'].join(','));
    lines.push(
      ['Overview', 'Institution', csvEscape(institution.name)].join(','),
    );
    lines.push(
      ['Overview', 'Report Period', csvEscape(PERIOD_LABELS[period])].join(','),
    );
    lines.push(
      [
        'Overview',
        'Period Range',
        csvEscape(
          `${this.formatDate(periodStart)} – ${this.formatDate(periodEnd)}`,
        ),
      ].join(','),
    );
    lines.push(['Overview', 'County', csvEscape(summary.county)].join(','));
    lines.push(['Overview', 'District', csvEscape(summary.district)].join(','));
    lines.push(
      ['Participation', 'Approved Petitions', summary.petitionsCount].join(','),
    );
    lines.push(
      ['Participation', 'Total Signatures', summary.signaturesTotal].join(','),
    );
    lines.push(
      [
        'Participation',
        'Directly Affected',
        summary.directlyAffectedCount,
      ].join(','),
    );
    lines.push(
      ['Participation', 'Nearby Community', summary.nearbyCommunityCount].join(
        ',',
      ),
    );

    for (const row of summary.topCategories) {
      lines.push(
        [
          'Top Categories',
          csvEscape(row.category ?? 'Uncategorized'),
          row.count,
        ].join(','),
      );
    }
    for (const row of summary.topAffectedAreas) {
      lines.push(
        ['Most Affected Communities', csvEscape(row.community), row.count].join(
          ',',
        ),
      );
    }

    return lines.join('\n');
  }

  async generatePdf(
    institution: Institution,
    period: ConstituencyReportPeriod,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<Buffer> {
    const { summary } = await this.gatherReportData(
      institution,
      periodStart,
      periodEnd,
    );

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    doc
      .fillColor('#0f172a')
      .fontSize(20)
      .text('CHANGE LIBERIA', { align: 'center' });
    doc.moveDown(0.3);
    doc
      .fontSize(12)
      .fillColor('#475569')
      .text(`${PERIOD_LABELS[period]} Constituency Report`, {
        align: 'center',
      });
    doc
      .fontSize(10)
      .fillColor('#64748b')
      .text(`${this.formatDate(periodStart)} – ${this.formatDate(periodEnd)}`, {
        align: 'center',
      });
    doc.moveDown(1);

    doc.fontSize(16).fillColor('#111827').text(institution.name);
    doc.moveDown(0.3);
    doc
      .fontSize(11)
      .fillColor('#334155')
      .text(
        [summary.county, summary.district].filter(Boolean).join(' · ') ||
          'National',
      );
    doc.moveDown(1);

    const leftColWidth = 260;
    doc
      .fontSize(12)
      .fillColor('#0f172a')
      .text('Participation summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Approved petitions: ${summary.petitionsCount.toLocaleString()}`, {
      width: leftColWidth,
    });
    doc.text(`Total signatures: ${summary.signaturesTotal.toLocaleString()}`, {
      width: leftColWidth,
    });
    doc.text(
      `Directly affected: ${summary.directlyAffectedCount.toLocaleString()}`,
      { width: leftColWidth },
    );
    doc.text(
      `Nearby community: ${summary.nearbyCommunityCount.toLocaleString()}`,
      { width: leftColWidth },
    );
    doc.moveDown(1);

    const renderRows = (
      label: string,
      rows: { label: string; count: number }[],
    ) => {
      doc.fontSize(12).fillColor('#0f172a').text(label, { underline: true });
      doc.moveDown(0.5);
      if (rows.length === 0) {
        doc
          .fontSize(10)
          .fillColor('#64748b')
          .text('No data recorded for this period.', { width: 500 });
      } else {
        rows.forEach((r) => {
          if (doc.y > 720) doc.addPage();
          doc
            .fontSize(10)
            .fillColor('#334155')
            .text(`${r.label}: ${r.count.toLocaleString()}`, { width: 500 });
        });
      }
      doc.moveDown(0.7);
    };

    renderRows(
      'Top categories',
      summary.topCategories.map((c) => ({
        label: c.category ?? 'Uncategorized',
        count: c.count,
      })),
    );
    renderRows(
      'Most affected communities',
      summary.topAffectedAreas.map((a) => ({
        label: a.community,
        count: a.count,
      })),
    );

    doc
      .fontSize(10)
      .fillColor('#64748b')
      .text(
        'This report was automatically generated by Change Liberia. Figures are descriptive aggregate counts only, never a ranking of petitions.',
        { width: 500 },
      );

    doc.info.Title = `${institution.name} — ${PERIOD_LABELS[period]} Constituency Report`;
    doc.end();

    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }
}
