// PDF Generator Service for Invoices

export async function exportInvoiceToPdf(elementId: string, invoiceNumber: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return false;
  }

  try {
    // Attempt html2pdf if available in window or module
    // @ts-expect-error html2pdf window global or dynamic import
    if (typeof window !== 'undefined' && window.html2pdf) {
      // @ts-expect-error global html2pdf
      await window.html2pdf().from(element).set({
        margin: [10, 10, 10, 10],
        filename: `${invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save();
      return true;
    }

    // Try dynamic import of html2pdf.js
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      if (html2pdf) {
        await html2pdf().from(element).set({
          margin: [10, 10, 10, 10],
          filename: `${invoiceNumber}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).save();
        return true;
      }
    } catch {
      // fallback to jspdf + html2canvas
    }

    // Fallback: html2canvas + jsPDF
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${invoiceNumber}.pdf`);
    return true;
  } catch (err) {
    console.warn("Falling back to browser print dialog for invoice export:", err);
    window.print();
    return true;
  }
}
