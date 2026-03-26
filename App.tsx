import React, { Component, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import UpdateNotification from './components/UpdateNotification';

// Lazy-load all pages for performance
const Home                = lazy(() => import('./pages/Home'));
const About               = lazy(() => import('./pages/About'));
const EQD2Page            = lazy(() => import('./pages/EQD2Page'));
const EBRTGapPage         = lazy(() => import('./pages/EBRTGapPage'));
const HDRBrachyPage       = lazy(() => import('./pages/HDRBrachyPage'));
const BEDtoEQD2Page       = lazy(() => import('./pages/BEDtoEQD2Page'));
const FracAdjustPage      = lazy(() => import('./pages/FracAdjustPage'));
const TDFPage             = lazy(() => import('./pages/TDFPage'));
const RadiationUnitsPage  = lazy(() => import('./pages/RadiationUnitsPage'));
const DoseExposuresPage   = lazy(() => import('./pages/DoseExposuresPage'));
const VivaDefinitionsPage = lazy(() => import('./pages/VivaDefinitionsPage'));
const RadiationHistoryPage= lazy(() => import('./pages/RadiationHistoryPage'));
const OARReferencePage    = lazy(() => import('./pages/OARReferencePage'));
const OARReferenceV2Page  = lazy(() => import('./pages/OARReferenceV2Page'));
const ReirradiationCalcPage = lazy(() => import('./pages/ReirradiationCalcPage'));
const ClinicalGuidelinesPage = lazy(() => import('./pages/ClinicalGuidelinesPage'));
const SBRTConstraintsPage   = lazy(() => import('./pages/SBRTConstraintsPage'));
const RadioactiveSourcesPage = lazy(() => import('./pages/RadioactiveSourcesPage'));
const RadioiodineI131Page    = lazy(() => import('./pages/RadioiodineI131Page'));
const ICRUPage               = lazy(() => import('./pages/ICRUPage'));
const OERLETRBEPage          = lazy(() => import('./pages/oerletrbe'));
const IonizingRadiationEffectsPage = lazy(() => import('./pages/ionizingradiation'));
const NamedEffectsPage       = lazy(() => import('./pages/NamedEffectsPage'));
const RadiationMechanismPage     = lazy(() => import('./pages/radiationmechanism'));
const CellSurvivalPage           = lazy(() => import('./pages/cellsurvivalcurve'));
const PediatricConstraints     = lazy(() => import('./pages/PediatricConstraints'));
const ClinicalTrials           = lazy(() => import('./pages/ClinicalTrials'));
const ToxicityGrading          = lazy(() => import('./pages/ToxicityGrading'));
const DoseRateComparison       = lazy(() => import('./pages/DoseRateComparison'));
const CervixBrachytherapy      = lazy(() => import('./pages/CervixBrachytherapy'));
const BrachytherapyReference     = lazy(() => import('./pages/BrachytherapyReference'));
const AdaptiveRT                 = lazy(() => import('./pages/AdaptiveRT'));
const ContouringAtlas            = lazy(() => import('./pages/ContouringAtlas'));

// ── Minimal inline spinner — no external deps ─────────────────────────────
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="flex flex-col items-center gap-3">
      <svg
        className="animate-spin w-7 h-7 text-blue-700"
        xmlns="http://www.w3.org/2000/svg"
        fill="none" viewBox="0 0 24 24"
      >
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-80" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Loading</span>
    </div>
  </div>
);

// ── Global error boundary ─────────────────────────────────────────────────
interface ErrState { hasError: boolean; message: string }
class ErrorBoundary extends Component<{ children: React.ReactNode }, ErrState> {
  state: ErrState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrState {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <p className="text-sm font-bold text-red-700 mb-1">Page failed to load</p>
          <p className="text-xs text-slate-500 font-mono mb-4">{this.state.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="text-xs px-4 py-2 bg-blue-700 text-white rounded font-semibold"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── App ───────────────────────────────────────────────────────────────────
const Layout: React.FC = () => {
  const location = useLocation();
  const isImmersive = ['/radiation-mechanism', '/cell-survival', '/eqd2', '/pediatric-constraints', '/clinical-trials', '/toxicity-grading', '/dose-rate-comparison', '/cervix-brachytherapy', '/brachytherapy-reference', '/adaptive-rt', '/oar-limits', '/oar-limits-v2', '/sbrt'].includes(location.pathname);

  return (
    <div className={`flex flex-col min-h-screen ${isImmersive ? 'bg-slate-950' : 'bg-zinc-50'}`}>
      <Header />
      <PWAInstallPrompt />
      <UpdateNotification />
      <main className={`flex-grow w-full ${isImmersive ? '' : 'max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10'}`}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <div className="w-full h-full">
                <Routes location={location}>
                  <Route path="/"              element={<Home />} />
                  <Route path="/about"         element={<About />} />
                  <Route path="/eqd2"          element={<EQD2Page />} />
                  <Route path="/ebrt-gap"      element={<EBRTGapPage />} />
                  <Route path="/hdr-brachy"    element={<HDRBrachyPage />} />
                  <Route path="/bed-eqd2"      element={<BEDtoEQD2Page />} />
                  <Route path="/frac-adjust"   element={<FracAdjustPage />} />
                  <Route path="/tdf"           element={<TDFPage />} />
                  <Route path="/radiation-units" element={<RadiationUnitsPage />} />
                  <Route path="/dose-exposures" element={<DoseExposuresPage />} />
                  <Route path="/viva-definitions" element={<VivaDefinitionsPage />} />
                  <Route path="/radiation-history" element={<RadiationHistoryPage />} />
                  <Route path="/oar-limits"    element={<OARReferencePage />} />
                  <Route path="/oar-limits-v2" element={<OARReferenceV2Page />} />
                  <Route path="/reirradiation" element={<ReirradiationCalcPage />} />
                  <Route path="/guidelines"    element={<ClinicalGuidelinesPage />} />
                  <Route path="/sbrt"          element={<SBRTConstraintsPage />} />
                  <Route path="/radioactive-sources" element={<RadioactiveSourcesPage />} />
                  <Route path="/radioiodine-i131" element={<RadioiodineI131Page />} />
                  <Route path="/icru"          element={<ICRUPage />} />
                  <Route path="/oerletrbe"     element={<OERLETRBEPage />} />
                  <Route path="/ionizing-radiation" element={<IonizingRadiationEffectsPage />} />
                  <Route path="/named-effects" element={<NamedEffectsPage />} />
                  <Route path="/radiation-mechanism" element={<RadiationMechanismPage />} />
                  <Route path="/cell-survival"       element={<CellSurvivalPage />} />
                  <Route path="/pediatric-constraints" element={<PediatricConstraints />} />
                  <Route path="/clinical-trials"       element={<ClinicalTrials />} />
                  <Route path="/toxicity-grading"      element={<ToxicityGrading />} />
                  <Route path="/dose-rate-comparison"  element={<DoseRateComparison />} />
                  <Route path="/cervix-brachytherapy"  element={<CervixBrachytherapy />} />
                  <Route path="/brachytherapy-reference" element={<BrachytherapyReference />} />
                  <Route path="/adaptive-rt"           element={<AdaptiveRT />} />
                  <Route path="/contouring-atlas"      element={<ContouringAtlas />} />
                </Routes>
            </div>
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <Router>
    <Layout />
  </Router>
);

export default App;