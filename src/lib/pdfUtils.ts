import { pdf } from '@react-pdf/renderer';
import React from 'react';

/**
 * Generates a high-quality PDF blob from a React component.
 */
export const generatePDFBlob = async (document: React.ReactElement) => {
  const blob = await pdf(document).toBlob();
  return blob;
};

/**
 * Shares a PDF file via WhatsApp or other apps using Web Share API.
 * If Web Share is unavailable, it downloads the file and opens WhatsApp.
 */
export const sharePDF = async (blob: Blob, filename: string, text: string) => {
  const file = new File([blob], filename, { type: 'application/pdf' });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
        text: text,
      });
      return true;
    } catch (err) {
      console.error('Error sharing file:', err);
      return false;
    }
  } else {
    // Fallback for desktop or unsupported browsers
    // We can't share the file directly to WhatsApp via URL, 
    // so we download it and provide a WhatsApp link to the app.
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Open WhatsApp with a message
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + " I've just generated a clinical report. The PDF has been downloaded to my device.")}`;
    window.open(whatsappUrl, '_blank');
    return false;
  }
};
