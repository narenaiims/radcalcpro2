
import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { ExternalLink, Globe, Gamepad2, HeartPulse, BookOpen, Info, Download, Share2, Calculator, Zap } from 'lucide-react';
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

  const oncologistApps = [
    {
      title: 'Medical Oncology Calculator',
      description: 'Practice oriented Medical oncology calculator for PG trainees.',
      url: 'https://oncocalcpro2.vercel.app/',
      icon: Calculator,
      color: 'bg-blue-600',
      tag: 'Oncologist App'
    },
    {
      title: 'Radiation Oncology Calculator',
      description: 'Academic and practice of Radiation Oncology calculator.',
      url: 'https://radcalcpro2.vercel.app',
      icon: Zap,
      color: 'bg-amber-500',
      tag: 'Oncologist App'
    },
    {
      title: 'OncoScreen Pro 2',
      description: 'Oncologist tool for precise screening of individual.',
      url: 'https://oncoscreenpro2.vercel.app/',
      icon: HeartPulse,
      color: 'bg-rose-500',
      tag: 'Oncologist App'
    },
    {
      title: 'OncoScreen PG',
      description: 'Screening and prevention for PG trainees.',
      url: 'https://oncoscreenpg.vercel.app',
      icon: BookOpen,
      color: 'bg-indigo-600',
      tag: 'Oncologist App'
    }
  ];

  const citizenApps = [
    {
      title: 'Onco Game',
      description: 'Interactive gamified education to dispel cancer myths and spread awareness.',
      url: 'https://onco-game.netlify.app/',
      icon: Gamepad2,
      color: 'bg-purple-500',
      tag: 'Citizen App'
    },
    {
      title: 'Preventive Health Advisor',
      description: 'Self screening by citizens for cancer and chronic diseases.',
      url: 'https://preventive-health-advisor-udaipur-m.vercel.app/',
      icon: HeartPulse,
      color: 'bg-emerald-500',
      tag: 'Citizen App'
    },
    {
      title: 'Poshan Shakti Nutrition',
      description: 'AI-driven personalized nutrition planning based on symptoms.',
      url: 'https://poshan-shakti-2.vercel.app/',
      icon: Globe,
      color: 'bg-orange-500',
      tag: 'Citizen App'
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
          <p className="text-zinc-500 font-medium px-4">Senior Oncologist in Udaipur · Professor and Head of Radiation Oncology</p>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <div className="w-1 h-6 bg-blue-600 rounded-full" />
          <h2 className="text-xl font-bold text-zinc-900 font-display">Oncologist Apps</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {oncologistApps.map((app, i) => {
            const Icon = app.icon;
            return (
            <a
              key={app.url}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group animate-in fade-in slide-in-from-bottom-4 duration-500 block outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-xl"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <Card className="hover:border-zinc-900 hover:shadow-md active:scale-[0.98] active:bg-zinc-50 active:shadow-inner transition-all duration-200 cursor-pointer overflow-hidden relative">
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-2xl ${app.color} flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{app.tag}</span>
                      <ExternalLink className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 font-display truncate">{app.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{app.description}</p>
                    <p className="text-[11px] font-mono text-blue-600/80 truncate pt-1 group-hover:text-blue-600 transition-colors">
                      {app.url.replace(/^https?:\/\//, '')}
                    </p>
                  </div>
                </div>
              </Card>
            </a>
            );
          })}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <div className="w-1 h-6 bg-emerald-600 rounded-full" />
          <h2 className="text-xl font-bold text-zinc-900 font-display">Citizen Apps</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {citizenApps.map((app, i) => {
            const Icon = app.icon;
            return (
            <a
              key={app.url}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group animate-in fade-in slide-in-from-bottom-4 duration-500 block outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-xl"
              style={{ animationDelay: `${(i + oncologistApps.length) * 100}ms` }}
            >
              <Card className="hover:border-zinc-900 hover:shadow-md active:scale-[0.98] active:bg-zinc-50 active:shadow-inner transition-all duration-200 cursor-pointer overflow-hidden relative">
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-2xl ${app.color} flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{app.tag}</span>
                      <ExternalLink className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 font-display truncate">{app.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{app.description}</p>
                    <p className="text-[11px] font-mono text-blue-600/80 truncate pt-1 group-hover:text-blue-600 transition-colors">
                      {app.url.replace(/^https?:\/\//, '')}
                    </p>
                  </div>
                </div>
              </Card>
            </a>
            );
          })}
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
            href="https://www.linkedin.com/in/dr-narendra-rathore-4543983" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-50 active:scale-95 active:bg-zinc-100 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            LinkedIn Profile
          </a>
          <a 
            href="mailto:drnarendra_rathore@icloud.com"
            className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-50 active:scale-95 active:bg-zinc-100 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Contact via Email
          </a>
          {canInstall ? (
            <button 
              onClick={installPWA}
              className="px-4 py-2 bg-blue-600 border border-blue-700 rounded-xl text-xs font-bold text-white hover:bg-blue-700 active:scale-95 active:bg-blue-800 transition-all flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <Download className="w-3.5 h-3.5" />
              Install App
            </button>
          ) : (
            <button 
              onClick={() => window.open(window.location.href, '_blank')}
              className="px-4 py-2 bg-zinc-200 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-300 active:scale-95 active:bg-zinc-400 transition-all flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
              title="Install available when opened in Chrome browser directly"
            >
              <Download className="w-3.5 h-3.5" />
              Install Info
            </button>
          )}
          <button 
            onClick={() => {
              const shareData = {
                title: 'RadCalcPro V2',
                text: 'Clinical Radiobiology & OAR Reference for Radiation Oncology by Dr. Narendra Rathore.',
                url: window.location.origin,
              };
              if (navigator.share) {
                navigator.share(shareData);
              } else {
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`, '_blank');
              }
            }}
            className="px-4 py-2 bg-green-600 border border-green-700 rounded-xl text-xs font-bold text-white hover:bg-green-700 active:scale-95 active:bg-green-800 transition-all flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
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
