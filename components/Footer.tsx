import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1e3a5f] text-blue-100 text-[11px] pb-10">
      {/* ── Primary row ──────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-2 flex flex-wrap items-start justify-between gap-4">

        {/* Branding + author */}
        <div className="space-y-0.5">
          <p className="font-bold text-white text-xs tracking-tight">RadOnc Pro Portal</p>
          <p className="text-blue-200/80">
            Dr. Narendra Rathore, MD (RT)<br />
            HoD Radiation Oncology<br />
            RNT Medical College &amp; MB Hospital, Udaipur
          </p>
          <a
            href="https://twitter.com/drn_dr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-blue-300 hover:text-white transition font-medium mt-1"
          >
            @drn_dr
          </a>
        </div>

        {/* Quick links */}
        <nav aria-label="Footer navigation">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">Tools</p>
          <ul className="space-y-0.5">
            {[
              { to: '/eqd2',       label: 'BED / EQD2' },
              { to: '/hdr-brachy', label: 'HDR Brachy' },
              { to: '/oar-limits', label: 'OAR Limits' },
              { to: '/oar-limits-v2', label: 'OAR V2' },
              { to: '/guidelines', label: 'Emergencies' },
              { to: '/reirradiation', label: 'Re-RT Calc' },
            ].map(l => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-blue-200/80 hover:text-white transition"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* References */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">Evidence Base</p>
          <ul className="space-y-0.5 text-blue-200/70">
            <li>QUANTEC 2010 (IJROBP)</li>
            <li>GEC-ESTRO EMBRACE</li>
            <li>RTOG / NRG Protocols</li>
            <li>TROG Guidelines</li>
            <li>ICRU Reports 83, 91</li>
            <li>Hall &amp; Giaccia 8th Ed.</li>
          </ul>
        </div>
      </div>

      {/* ── Disclaimer ───────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pt-2 border-t border-blue-900/60">
        <p className="text-[10px] text-blue-200/60 leading-relaxed">
          <span className="font-bold text-red-400">⚕ DISCLAIMER:</span>{' '}
          All calculations are for <span className="font-semibold">educational and training purposes only</span>.
          Clinical decisions require independent verification against institutional protocols,
          current guidelines, and qualified medical judgement. Doses must be confirmed by a
          qualified Radiation Oncologist and Medical Physicist before patient application.
        </p>
        <p className="mt-2 text-[10px] text-blue-200/40 uppercase tracking-widest">
          © {year} RadOnc Pro · Built for Postgraduate Education
        </p>
      </div>
    </footer>
  );
};

export default Footer;