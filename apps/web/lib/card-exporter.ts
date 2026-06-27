import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type CardSize = 'square' | 'story' | 'landscape';

const CARD_SIZES: Record<CardSize, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  landscape: { width: 1200, height: 630 },
};

// html2canvas v1.4.x doesn't await onclone, so async image conversion must
// happen *before* calling html2canvas. The generator pre-converts all images to
// data URLs and passes them into the export card — so by the time we reach here
// every <img> src is already a data URL (no canvas taint).
const makeOptions = (dimensions: { width: number; height: number }) => ({
  width: dimensions.width,
  height: dimensions.height,
  scale: 1,
  logging: false,
  useCORS: false,
  allowTaint: false,
  backgroundColor: '#ffffff',
  windowWidth: dimensions.width,
  windowHeight: dimensions.height,
  x: 0,
  y: 0,
  scrollX: 0,
  scrollY: 0,
});

export async function exportCardAsPNG(element: HTMLElement, size: CardSize, filename: string): Promise<void> {
  const dimensions = CARD_SIZES[size];
  const canvas = await html2canvas(element, makeOptions(dimensions));
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `${filename}-${size}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportCardAsPDF(element: HTMLElement, size: CardSize, filename: string): Promise<void> {
  const dimensions = CARD_SIZES[size];
  const canvas = await html2canvas(element, makeOptions(dimensions));
  const imgData = canvas.toDataURL('image/png');
  const widthMM = (dimensions.width / 96) * 25.4;
  const heightMM = (dimensions.height / 96) * 25.4;
  const pdf = new jsPDF({
    orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [widthMM, heightMM],
  });
  pdf.addImage(imgData, 'PNG', 0, 0, widthMM, heightMM);
  pdf.save(`${filename}-${size}.pdf`);
}

export async function exportCardAsSVG(element: HTMLElement, size: CardSize, filename: string): Promise<void> {
  const dimensions = CARD_SIZES[size];
  const cloned = element.cloneNode(true) as HTMLElement;
  cloned.style.width = `${dimensions.width}px`;
  cloned.style.height = `${dimensions.height}px`;
  const svg = `<svg width="${dimensions.width}" height="${dimensions.height}" xmlns="http://www.w3.org/2000/svg"><foreignObject width="${dimensions.width}" height="${dimensions.height}"><div xmlns="http://www.w3.org/1999/xhtml">${cloned.outerHTML}</div></foreignObject></svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${size}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportAllFormats(element: HTMLElement, sizes: CardSize[], filename: string): Promise<void> {
  for (const size of sizes) {
    try {
      await exportCardAsPNG(element, size, filename);
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`Failed to export ${size} PNG:`, error);
    }
  }
}
