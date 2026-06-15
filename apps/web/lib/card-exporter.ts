import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type CardSize = 'square' | 'story' | 'landscape';

interface CardDimensions {
  width: number;
  height: number;
  dpi: number;
}

const CARD_SIZES: Record<CardSize, CardDimensions> = {
  square: { width: 1080, height: 1080, dpi: 96 },
  story: { width: 1080, height: 1920, dpi: 96 },
  landscape: { width: 1200, height: 630, dpi: 96 },
};

export async function exportCardAsPNG(
  element: HTMLElement,
  size: CardSize,
  filename: string,
): Promise<void> {
  const dimensions = CARD_SIZES[size];
  const scale = dimensions.dpi / 96;

  const canvas = await html2canvas(element, {
    width: dimensions.width,
    height: dimensions.height,
    scale,
    logging: false,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    windowWidth: dimensions.width,
    windowHeight: dimensions.height,
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
  });

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `${filename}-${size}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportCardAsPDF(
  element: HTMLElement,
  size: CardSize,
  filename: string,
): Promise<void> {
  const dimensions = CARD_SIZES[size];
  const scale = dimensions.dpi / 96;

  const canvas = await html2canvas(element, {
    width: dimensions.width,
    height: dimensions.height,
    scale,
    logging: false,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    windowWidth: dimensions.width,
    windowHeight: dimensions.height,
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
  });

  const imgData = canvas.toDataURL('image/png');
  const widthMM = dimensions.width / (dimensions.dpi / 25.4);
  const heightMM = dimensions.height / (dimensions.dpi / 25.4);

  const pdf = new jsPDF({
    orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [widthMM, heightMM],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, widthMM, heightMM);
  pdf.save(`${filename}-${size}.pdf`);
}

export async function exportCardAsSVG(
  element: HTMLElement,
  size: CardSize,
  filename: string,
): Promise<void> {
  const dimensions = CARD_SIZES[size];
  const clonedElement = element.cloneNode(true) as HTMLElement;
  clonedElement.style.width = `${dimensions.width}px`;
  clonedElement.style.height = `${dimensions.height}px`;

  const svgString = `
    <svg width="${dimensions.width}" height="${dimensions.height}" xmlns="http://www.w3.org/2000/svg">
      <foreignObject width="${dimensions.width}" height="${dimensions.height}">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${clonedElement.outerHTML}
        </div>
      </foreignObject>
    </svg>
  `;

  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${size}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportAllFormats(
  element: HTMLElement,
  sizes: CardSize[],
  filename: string,
): Promise<void> {
  for (const size of sizes) {
    try {
      await exportCardAsPNG(element, size, filename);
      // Add small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`Failed to export ${size} PNG:`, error);
    }
  }
}
