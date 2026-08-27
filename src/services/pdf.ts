import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// PDF Generator Service for Invoices
export async function exportInvoiceToPdf(elementId: string, invoiceNumber: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return false;
  }

  try {
    // Ensure all images inside the printable area (e.g., company logo) are loaded
    const images = element.querySelectorAll('img');
    const imagePromises = Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });
    await Promise.all(imagePromises);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1024
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Fit canvas width to A4 page margins (8mm margin)
    const margin = 8;
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    if (contentHeight <= pdfHeight - margin * 2) {
      // Single page perfect fit
      pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight);
    } else {
      // Multi-page handling
      let heightLeft = contentHeight;
      let position = margin;
      const pageHeight = pdfHeight - margin * 2;
      
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - contentHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
        heightLeft -= pageHeight;
      }
    }

    const safeFilename = `Invoice_${(invoiceNumber || 'INV-001').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    pdf.save(safeFilename);
    return true;
  } catch (err) {
    console.warn("Falling back to browser print dialog for invoice export:", err);
    window.print();
    return true;
  }
}

