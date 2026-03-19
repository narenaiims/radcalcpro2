import React from 'react';
import { Share2 } from 'lucide-react';

interface ShareButtonProps {
  className?: string;
  variant?: 'icon' | 'full';
  children?: React.ReactNode;
}

const ShareButton: React.FC<ShareButtonProps> = ({ className = '', variant = 'icon', children }) => {
  const shareData = {
    title: 'RadOnc Pro Portal',
    text: 'Check out RadOnc Pro — Clinical Radiobiology Calculators for Radiation Oncology by Dr. Narendra Rathore.',
    url: 'https://radcalcpro2.vercel.app/',
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: WhatsApp direct link
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
        shareData.text + ' ' + shareData.url
      )}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (variant === 'full') {
    return (
      <button
        onClick={handleShare}
        className={`flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-xs hover:bg-green-700 transition shadow-md ${className}`}
      >
        <Share2 className="w-4 h-4" />
        Share via WhatsApp
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className={`rounded-xl text-blue-200 hover:text-white hover:bg-white/5 transition-all ${className || 'p-2'}`}
      aria-label="Share app"
    >
      <Share2 className="w-4 h-4 drop-shadow-sm shrink-0" />
      {children}
    </button>
  );
};

export default ShareButton;
