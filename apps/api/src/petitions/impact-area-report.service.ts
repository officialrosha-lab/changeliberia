import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { PetitionsService } from './petitions.service';

/**
 * Petition Location Verification & Impact Area System (Phase 3) —
 * government report exports (CSV/PDF/Excel) for a single petition.
 * All aggregate-only: never includes individual signer identities or
 * per-signature classification/confidence data.
 */
@Injectable()
export class ImpactAreaReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly petitionsService: PetitionsService,
  ) {}

  private async gatherReportData(petitionId: string) {
    const petition = await this.prisma.petition.findUnique({ where: { id: petitionId } });
    if (!petition) throw new NotFoundException(`Petition with ID ${petitionId} not found`);

    const [breakdown, insights] = await Promise.all([
      this.petitionsService.getSignatureBreakdown(petitionId),
      this.petitionsService.getCommunityInsights(petitionId, 10),
    ]);

    return { petition, breakdown, insights };
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private textOrEmpty(value: string | null | undefined, fallback = 'Not specified'): string {
    return value?.trim() ? value : fallback;
  }

  private affectedAreaLabel(petition: { impactScope: string | null; county: string | null; district: string | null; community: string | null; counties: string[] }): string {
    switch (petition.impactScope) {
      case 'NATIONAL':
        return 'National (all of Liberia)';
      case 'MULTI_COUNTY':
        return petition.counties.length ? petition.counties.join(', ') : 'Multiple counties';
      case 'COMMUNITY':
        return [petition.community, petition.district, petition.county].filter(Boolean).join(', ') || 'Not specified';
      case 'DISTRICT':
        return [petition.district, petition.county].filter(Boolean).join(', ') || 'Not specified';
      case 'COUNTY':
        return petition.county ?? 'Not specified';
      default:
        return this.textOrEmpty(petition.county, 'Not specified');
    }
  }

  async generateCsv(petitionId: string): Promise<string> {
    const { petition, breakdown, insights } = await this.gatherReportData(petitionId);
    const csvEscape = (val: string | number | null | undefined) =>
      `"${String(val ?? '').replace(/"/g, '""')}"`;

    const lines: string[] = [];
    lines.push(['Section', 'Field', 'Value'].join(','));
    lines.push(['Overview', 'Petition Title', csvEscape(petition.title)].join(','));
    lines.push(['Overview', 'Impact Scope', csvEscape(petition.impactScope ?? 'Not specified')].join(','));
    lines.push(['Overview', 'Affected Area', csvEscape(this.affectedAreaLabel(petition))].join(','));
    lines.push(['Overview', 'Report Generated', csvEscape(this.formatDate(new Date()))].join(','));
    lines.push(['Participation', 'Total Supporters', breakdown.total].join(','));
    lines.push(['Participation', 'Directly Affected', breakdown.directlyAffected].join(','));
    lines.push(['Participation', 'Nearby Community', breakdown.nearbyCommunity].join(','));
    lines.push(['Participation', 'Supporter (National)', breakdown.supporters].join(','));
    lines.push(['Participation', 'Diaspora Support', breakdown.diasporaSupport].join(','));
    lines.push(['Participation', 'Unclassified', breakdown.unknown].join(','));

    for (const row of insights.byCounty) {
      lines.push(['County Participation', csvEscape(row.label), row.count].join(','));
    }
    for (const row of insights.byDistrict) {
      lines.push(['District Participation', csvEscape(row.label), row.count].join(','));
    }
    for (const row of insights.byCommunity) {
      lines.push(['Top Communities', csvEscape(row.label), row.count].join(','));
    }

    return lines.join('\n');
  }

  async generateExcel(petitionId: string): Promise<Buffer> {
    const { petition, breakdown, insights } = await this.gatherReportData(petitionId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Change Liberia';
    workbook.created = new Date();

    const overview = workbook.addWorksheet('Overview');
    overview.columns = [
      { header: 'Field', key: 'field', width: 28 },
      { header: 'Value', key: 'value', width: 60 },
    ];
    overview.addRows([
      { field: 'Petition Title', value: petition.title },
      { field: 'Impact Scope', value: petition.impactScope ?? 'Not specified' },
      { field: 'Affected Area', value: this.affectedAreaLabel(petition) },
      { field: 'Report Generated', value: this.formatDate(new Date()) },
      { field: 'Total Supporters', value: breakdown.total },
      { field: 'Directly Affected', value: breakdown.directlyAffected },
      { field: 'Nearby Community', value: breakdown.nearbyCommunity },
      { field: 'Supporter (National)', value: breakdown.supporters },
      { field: 'Diaspora Support', value: breakdown.diasporaSupport },
      { field: 'Unclassified', value: breakdown.unknown },
    ]);
    overview.getRow(1).font = { bold: true };

    const geo = workbook.addWorksheet('Geographic Distribution');
    geo.columns = [
      { header: 'Level', key: 'level', width: 20 },
      { header: 'Area', key: 'area', width: 30 },
      { header: 'Count', key: 'count', width: 12 },
    ];
    for (const row of insights.byCounty) geo.addRow({ level: 'County', area: row.label, count: row.count });
    for (const row of insights.byDistrict) geo.addRow({ level: 'District', area: row.label, count: row.count });
    for (const row of insights.byCommunity) geo.addRow({ level: 'Community', area: row.label, count: row.count });
    geo.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generatePdf(petitionId: string): Promise<Buffer> {
    const { petition, breakdown, insights } = await this.gatherReportData(petitionId);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    doc.fillColor('#0f172a').fontSize(20).text('CHANGE LIBERIA', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#475569').text('Impact Area Report', { align: 'center' });
    doc.fontSize(10).fillColor('#64748b').text(`Generated: ${this.formatDate(new Date())}`, { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(16).fillColor('#111827').text(petition.title);
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#334155').text(petition.summary, { width: 500, lineGap: 3 });
    doc.moveDown(1);

    const leftColWidth = 260;
    doc.fontSize(12).fillColor('#0f172a').text('Impact scope', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Scope: ${this.textOrEmpty(petition.impactScope)}`, { width: leftColWidth });
    doc.text(`Affected area: ${this.affectedAreaLabel(petition)}`, { width: 500 });
    doc.moveDown(1);

    doc.fontSize(12).fillColor('#0f172a').text('Participation breakdown', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Total supporters: ${breakdown.total.toLocaleString()}`, { width: leftColWidth });
    doc.text(`Directly affected: ${breakdown.directlyAffected.toLocaleString()}`, { width: leftColWidth });
    doc.text(`Nearby community: ${breakdown.nearbyCommunity.toLocaleString()}`, { width: leftColWidth });
    doc.text(`National support: ${breakdown.supporters.toLocaleString()}`, { width: leftColWidth });
    doc.text(`Diaspora support: ${breakdown.diasporaSupport.toLocaleString()}`, { width: leftColWidth });
    doc.moveDown(1);

    doc.fontSize(12).fillColor('#0f172a').text('Geographic distribution', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#334155');

    const renderRows = (label: string, rows: { label: string; count: number }[]) => {
      doc.fontSize(11).fillColor('#0f172a').text(label, { underline: false });
      if (rows.length === 0) {
        doc.fontSize(10).fillColor('#64748b').text('No data recorded.', { width: 500 });
      } else {
        rows.forEach((r) => {
          if (doc.y > 720) doc.addPage();
          doc.fontSize(10).fillColor('#334155').text(`${r.label}: ${r.count.toLocaleString()}`, { width: 500 });
        });
      }
      doc.moveDown(0.7);
    };

    renderRows('County participation', insights.byCounty);
    renderRows('District participation', insights.byDistrict);
    renderRows('Top communities', insights.byCommunity);

    doc.fontSize(10).fillColor('#64748b').text(
      'This report was automatically generated by Change Liberia. Geographic figures are aggregate counts only; no individual signer locations are included.',
      { width: 500 },
    );

    doc.info.Title = `${petition.title} — Impact Area Report`;
    doc.end();

    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }
}
