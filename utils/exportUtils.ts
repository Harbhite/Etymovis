
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

type ExportFormat = 'png' | 'svg' | 'pdf' | 'jpeg';

/**
 * Initiates a file download in the browser.
 */
const downloadFile = (dataUrl: string, fileName: string, extension: string) => {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${fileName}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/**
 * Captures an element (HTML or SVG) as a canvas using html2canvas.
 * html2canvas is more robust against 'tainted canvas' issues than manual Blob conversion
 * as it attempts to resolve external resources with CORS.
 */
const captureToCanvas = async (element: HTMLElement | SVGSVGElement): Promise<HTMLCanvasElement> => {
  // If it's an SVG, we target its parent container for better html2canvas support,
  // or the element itself if it's a standard HTMLElement.
  const target = element instanceof SVGSVGElement ? (element.parentElement || element) : element;
  
  return html2canvas(target as HTMLElement, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: null, // Transparent to respect CSS/DarkMode
    onclone: (clonedDoc) => {
      // Ensure the cloned element is visible for capture
      const el = clonedDoc.querySelector('.visualization-container') as HTMLElement;
      if (el) {
        el.style.overflow = 'visible';
      }
    }
  });
};

/**
 * Exports an SVG element.
 */
export const exportSvgAs = async (svgElement: SVGSVGElement, format: ExportFormat, fileName: string) => {
  if (!svgElement) {
    console.error("SVG element not found for export.");
    return;
  }

  try {
    if (format === 'svg') {
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
      downloadFile(dataUrl, fileName, 'svg');
      return;
    }

    const canvas = await captureToCanvas(svgElement);
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const extension = format === 'pdf' ? 'pdf' : format;

    if (format === 'pdf') {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'l' : 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${fileName}.pdf`);
    } else {
      // For JPEG, we need a white background because transparency becomes black
      let finalDataUrl;
      if (format === 'jpeg') {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          // Create a new canvas to compose the white background
          const newCanvas = document.createElement('canvas');
          newCanvas.width = w;
          newCanvas.height = h;
          const newCtx = newCanvas.getContext('2d');
          if (newCtx) {
             newCtx.fillStyle = '#FFFFFF';
             newCtx.fillRect(0, 0, w, h);
             newCtx.drawImage(canvas, 0, 0);
             finalDataUrl = newCanvas.toDataURL(mimeType, 0.9);
          } else {
             finalDataUrl = canvas.toDataURL(mimeType, 0.9);
          }
        } else {
           finalDataUrl = canvas.toDataURL(mimeType, 0.9);
        }
      } else {
        finalDataUrl = canvas.toDataURL(mimeType, 0.9);
      }

      downloadFile(finalDataUrl, fileName, extension);
    }
  } catch (error) {
    console.error(`Error exporting as ${format}:`, error);
    // Provide user feedback
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg.includes('Tainted canvases')) {
      alert("Export failed due to security restrictions (Tainted Canvas). This usually happens when external images or fonts cannot be processed safely. Try the 'SVG' format instead.");
    } else {
      alert(`Export failed: ${msg}`);
    }
    throw error;
  }
};

/**
 * Exports an HTML element.
 */
export const exportHtmlAs = async (htmlElement: HTMLElement, format: ExportFormat, fileName: string) => {
  if (!htmlElement) {
    console.error("HTML element not found for export.");
    return;
  }

  try {
    const canvas = await captureToCanvas(htmlElement);
    const extension = format === 'pdf' ? 'pdf' : (format === 'svg' ? 'png' : format);
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';

    if (format === 'pdf') {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'l' : 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${fileName}.pdf`);
    } else {
      // For JPEG, ensure white background
      let finalDataUrl;
      if (format === 'jpeg') {
         const newCanvas = document.createElement('canvas');
         newCanvas.width = canvas.width;
         newCanvas.height = canvas.height;
         const newCtx = newCanvas.getContext('2d');
         if (newCtx) {
            newCtx.fillStyle = '#FFFFFF';
            newCtx.fillRect(0, 0, canvas.width, canvas.height);
            newCtx.drawImage(canvas, 0, 0);
            finalDataUrl = newCanvas.toDataURL(mimeType, 0.9);
         } else {
            finalDataUrl = canvas.toDataURL(mimeType, 0.9);
         }
      } else {
         finalDataUrl = canvas.toDataURL(mimeType, 0.9);
      }
      downloadFile(finalDataUrl, fileName, extension);
    }
  } catch (error) {
    console.error(`Error exporting HTML as ${format}:`, error);
    alert("Export failed. Please check the console for details.");
  }
};
