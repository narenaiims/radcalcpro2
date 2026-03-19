
import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { ExternalLink, Globe, Gamepad2, HeartPulse, Apple, BookOpen, Info, Download, Share2 } from 'lucide-react';
import { getDeferredPrompt, installPWA } from '../src/services/pwaService';

const About: React.FC = () => {
  const [canInstall, setCanInstall] = useState(!!getDeferredPrompt());

  useEffect(() => {
    const handler = () => setCanInstall(!!getDeferredPrompt());
    window.addEventListener('pwa-prompt-available', handler);
    window.addEventListener('pwa-prompt-cleared', handler);
    return () => {
      window.removeEventListener('pwa-prompt-available', handler);
      window.removeEventListener('pwa-prompt-cleared', handler);
    };
  }, []);
  const otherApps = [
    {
      title: 'Poshan Shakti 2',
      description: '7-दिवसीय सप्लीमेंट डाइट प्लान अपने लक्षणों और पसंद के आधार पर बनाएं।',
      url: 'https://poshan-shakti-2.vercel.app/',
      icon: Apple,
      color: 'bg-emerald-500',
      tag: 'Diet & Nutrition'
    },
    {
      title: 'Preventive Health Advisor',
      description: 'कैंसर, शुगर व हृदय रोग की हेल्थ स्क्रीनिंग और समय पर इलाज के लिए गाइड।',
      url: 'https://preventive-health-advisor-udaipur-m.vercel.app/',
      icon: HeartPulse,
      color: 'bg-red-500',
      tag: 'Screening'
    },
    {
      title: 'Onco-Game',
      description: 'खेल-खेल में कैंसर की जानकारी और समाज में फैले मिथकों को दूर करें।',
      url: 'https://onco-game.netlify.app/',
      icon: Gamepad2,
      color: 'bg-purple-500',
      tag: 'Education'
    },
    {
      title: 'Medical Oncology calculator',
      description: ' BSA, GFR, TLS and many other ward and ICU  calculators for residents.',
      url: 'https://oncocalcpro2.vercel.app/',
      icon: BookOpen,
      color: 'bg-blue-600',
      tag: 'Professional'
    }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-zinc-900 border-4 border-white shadow-2xl overflow-hidden">
          <img 
            src="https://unavatar.io/twitter/drn_dr" 
            alt="Dr. Narendra Rathore" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 font-display">Dr. Narendra Rathore</h1>
          <p className="text-zinc-500 font-medium">Oncologist, Professor & Head at RNT Medical College, Udaipur</p>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <div className="w-1 h-6 bg-emerald-600 rounded-full" />
          <h2 className="text-xl font-bold text-zinc-900 font-display">Digital Health Ecosystem</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {otherApps.map((app, i) => (
            <a
              key={app.url}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <Card className="hover:border-zinc-900 transition-all cursor-pointer overflow-hidden relative">
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-2xl ${app.color} flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                    <app.icon className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{app.tag}</span>
                      <ExternalLink className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 font-display">{app.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{app.description}</p>
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>
      </section>

      <section className="p-8 bg-zinc-100 rounded-[2.5rem] space-y-4">
        <div className="flex items-center gap-2 text-zinc-900">
          <Info className="w-5 h-5" />
          <h3 className="text-sm font-black uppercase tracking-widest">About the Developer</h3>
        </div>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Dr. Narendra Rathore is a leading Oncologist dedicated to bridging the gap between clinical expertise and digital technology. 
          His suite of applications aims to provide free, evidence-based tools for both healthcare professionals and patients to improve cancer care outcomes in India.
        </p>
        <div className="pt-4 flex flex-wrap gap-3">
          <a 
            href="https://twitter.com/drn_dr" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Follow on Twitter
          </a>
          <a 
            href="mailto:drnarendra.rathore@gmail.com"
            className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Contact via Email
          </a>
          {canInstall && (
            <button 
              onClick={installPWA}
              className="px-4 py-2 bg-blue-600 border border-blue-700 rounded-xl text-xs font-bold text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Install App
            </button>
          )}
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'radcalcpro2 Portal',
                  text: 'Check out radcalcpro2 — Clinical Radiobiology Calculators for Radiation Oncology by Dr. Narendra Rathore.',
                  url: 'https://radcalcpro2.vercel.app/',
                });
              } else {
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Check out radcalcpro2 — Clinical Radiobiology Calculators for Radiation Oncology by Dr. Narendra Rathore. https://radcalcpro2.vercel.app/')}`, '_blank');
              }
            }}
            className="px-4 py-2 bg-green-600 border border-green-700 rounded-xl text-xs font-bold text-white hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share via WhatsApp
          </button>
        </div>
      </section>
    </div>
  );
};

export default About;
