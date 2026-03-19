import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, ChevronRight, GraduationCap } from "lucide-react";
import KeyFactsSidebar, { KeyFactSection } from "@/components/KeyFactsSidebar";

// ── Data: Quick Reference ────────────────────────────────────────────────────
const SIDEBAR_DATA: KeyFactSection[] = [
  {
    title: "Dominance in Water",
    emoji: "💧",
    accent: "#38bdf8",
    bg: "rgba(56,189,232,0.08)",
    border: "rgba(56,189,232,0.4)",
    rows: [
      { k: "Photoelectric", v: "< 25 keV", mono: true },
      { k: "Compton", v: "25 keV – 25 MeV", mono: true },
      { k: "Pair Production", v: "> 25 MeV", mono: true },
    ]
  },
  {
    title: "Atomic Number (Z) Dep.",
    emoji: "⚛️",
    accent: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.4)",
    rows: [
      { k: "Photoelectric", v: "∝ Z³", mono: true },
      { k: "Compton", v: "Independent", mono: false },
      { k: "Pair Production", v: "∝ Z²", mono: true },
    ]
  },
  {
    title: "Key Thresholds",
    emoji: "🚧",
    accent: "#fbbf24",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.4)",
    rows: [
      { k: "Pair Production", v: "1.022 MeV", mono: true },
      { k: "Photonuclear", v: "> 7–10 MeV", mono: true },
      { k: "Lead K-edge", v: "88 keV", mono: true },
      { k: "Iodine K-edge", v: "33 keV", mono: true },
    ]
  },
  {
    title: "Radiobiology",
    emoji: "🧬",
    accent: "#f472b6",
    bg: "rgba(244,114,182,0.08)",
    border: "rgba(244,114,182,0.4)",
    rows: [
      { k: "4 Rs", v: "Repair, Repop, Redist, Reox", mono: false },
      { k: "OER (Low LET)", v: "2.5 – 3.0", mono: true },
      { k: "Early α/β", v: "~10 Gy", mono: true },
      { k: "Late α/β", v: "~3 Gy", mono: true },
    ]
  }
];

// ── Data: Interaction Mechanisms ─────────────────────────────────────────────
const mechanisms = [
  {
    id: "photoelectric",
    name: "Photoelectric Effect",
    subtitle: "Complete absorption",
    energy: "< 100 keV",
    probability: "τ ∝ Z³ / E³",
    color: "#f59e0b",
    glow: "#fbbf24",
    dark: "#92400e",
    description: "An incident photon is completely absorbed by an inner-shell (K or L) electron, ejecting it as a photoelectron.",
    boardsFact: "Z³ dependence: bone (Z≈13) absorbs ~8× more dose than soft tissue (Z≈7.5) at diagnostic energies.",
    clinicalPitfall: "At orthovoltage energies (100–300 kVp), bone receives 2–3× dose of adjacent soft tissue due to PE effect.",
    physicsDepth: [
      "Photoelectron KE = hν − E_b(K). For 100 keV photon on Pb: E_b(K)=88 keV → KE=12 keV.",
      "Fluorescence yield ω: fraction emitting characteristic X-ray vs Auger electron. High Z = high fluorescence.",
      "Mass attenuation coefficient μ/ρ ∝ Z³/E³ — doubling Z increases attenuation 8×.",
      "K-edge: Sharp increase in attenuation when photon energy just exceeds K-shell binding energy.",
      "Dominant crossover PE↔Compton occurs when Z≈(hν in keV)/25. For soft tissue (Z≈7.5): crossover ~25 keV.",
      "Auger electrons: very short range (<1 μm in tissue) → densely ionizing near source nucleus."
    ],
    clinicalApplications: [
      { label: "Orthovoltage RT (100–300 kVp)", detail: "PE dominant — bone sparing strategy required." },
      { label: "Brachytherapy seeds (I-125, Pd-103)", detail: "I-125 mean energy 28 keV, Pd-103 21 keV — PE dominant." },
      { label: "CT contrast & Hounsfield Units", detail: "Iodine (Z=53, K-edge 33 keV) and Barium (Z=56) exploit PE." },
      { label: "kV vs MV imaging", detail: "6 MV portal imaging: PE negligible → poor soft-tissue contrast." }
    ],
    formula: "τ ∝ Z³ / E³",
    formulaLabel: "Photoelectric attenuation coeff."
  },
  {
    id: "compton",
    name: "Compton Effect",
    subtitle: "Partial inelastic scatter",
    energy: "100 keV – 10 MeV",
    probability: "σ ∝ ρe / hν",
    color: "#ec4899",
    glow: "#f472b6",
    dark: "#831843",
    description: "An incident photon transfers part of its energy to a loosely-bound outer-shell electron, scattering at angle θ.",
    boardsFact: "Compton ∝ electron density (electrons/g), NOT atomic number Z. Water, fat, muscle, bone have similar electron density.",
    clinicalPitfall: "Lung electron density ≈ 0.26 relative to water. In 6 MV beams (Compton dominant), dose to lung is higher than expected if not corrected.",
    physicsDepth: [
      "Scattered photon energy: hν' = hν / [1 + (hν/mec²)(1−cosθ)].",
      "At θ=90° (side-scatter), max energy is 0.511 MeV. At θ=180° (backscatter), max is 0.255 MeV.",
      "Maximum recoil electron energy (backscatter, θ=180°): T_max = hν · 2α/(1+2α) where α = hν/mec².",
      "The Compton edge in pulse-height spectra corresponds to T_max.",
      "Klein-Nishina cross-section predicts forward-scatter predominance at high energies.",
      "At 6 MV: ~85% of photon interactions are Compton. At 15 MV: Compton ~75%, pair production ~25%."
    ],
    clinicalApplications: [
      { label: "Lung heterogeneity corrections", detail: "Collapsed lung (ρ≈0.3 g/cc) in SBRT requires Type B algorithms." },
      { label: "EPID transit dosimetry", detail: "Electronic Portal Imaging Devices exploit MV Compton interactions." },
      { label: "Tissue inhomogeneity in H&N", detail: "Air cavities in sinuses, larynx, oral cavity affect scatter." },
      { label: "MV CBCT image quality", detail: "MV CBCT uses Compton-dominated scatter — poor contrast vs kV." }
    ],
    formula: "Δλ = (h/mec)(1−cosθ) = 0.00243(1−cosθ) nm",
    formulaLabel: "Compton wavelength shift"
  },
  {
    id: "pairproduction",
    name: "Pair Production",
    subtitle: "Photon → e⁻ + e⁺",
    energy: "> 1.022 MeV",
    probability: "κ ∝ Z² · ln(E/mec²)",
    color: "#06b6d4",
    glow: "#22d3ee",
    dark: "#164e63",
    description: "A high-energy photon (>1.022 MeV) interacts with the Coulomb field of a nucleus, creating an electron-positron pair.",
    boardsFact: "Threshold = 2 × mec² = 1.022 MeV. Every MeV above threshold is split equally between e⁻ and e⁺ kinetic energy.",
    clinicalPitfall: "At 15–18 MV: 20–25% pair production. Resulting e⁻/e⁺ pairs travel forward, but annihilation photons are isotropic.",
    physicsDepth: [
      "Conservation of energy: hν = 2mec² + KE(e⁻) + KE(e⁺).",
      "Conservation of momentum requires a nuclear recoil to absorb momentum — pair production cannot occur in free space.",
      "Positron range before annihilation: ~1–4 mm in tissue at typical pair-production energies.",
      "Annihilation produces exactly two 0.511 MeV photons at 180° (conservation of momentum).",
      "Cross-section κ ∝ Z² · (ln E − const) — logarithmic energy dependence."
    ],
    clinicalApplications: [
      { label: "PET/CT staging & response", detail: "F-18 FDG β⁺ decay → positron → annihilation photons." },
      { label: "In-beam PET during particle therapy", detail: "Proton and C-12 beams produce positron emitters (C-11, O-15)." },
      { label: "High-energy vault shielding", detail: "15–18 MV primary barriers must account for annihilation radiation." },
      { label: "Linac head activation", detail: "Pair production in tungsten collimators and target." }
    ],
    formula: "hν → e⁻ + e⁺; threshold = 2mec² = 1.022 MeV",
    formulaLabel: "Pair production threshold"
  },
  {
    id: "coherent",
    name: "Rayleigh (Coherent) Scatter",
    subtitle: "Elastic, zero dose",
    energy: "< 30 keV",
    probability: "σR ∝ Z² / E²",
    color: "#a78bfa",
    glow: "#c4b5fd",
    dark: "#4c1d95",
    description: "The incident photon interacts with the entire atom simultaneously. All bound electrons vibrate coherently. No energy loss.",
    boardsFact: "Rayleigh scattering deposits ZERO dose. It merely redirects the photon. At mammographic energies (20-30 keV), ~10% of interactions.",
    clinicalPitfall: "Older brachytherapy TPS algorithms (1D point-source, TG-43) explicitly exclude Rayleigh scatter.",
    physicsDepth: [
      "Differential cross-section: dσR/dΩ ∝ |F(q,Z)|² (1+cos²θ)/2, where F(q,Z) is the atomic form factor.",
      "The atomic form factor F(q,Z) represents coherent interference from all Z electrons.",
      "Thomson scattering: the single free-electron classical analogue. σT = (8π/3)r₀² = 0.665 barn.",
      "Not to be confused with Raman scattering (inelastic coherent, molecular vibrations).",
      "In Monte Carlo codes (EGSnrc, Geant4, MCNP): Rayleigh must be enabled separately."
    ],
    clinicalApplications: [
      { label: "Mammography grid design", detail: "At 25–32 kVp: ~12% Rayleigh scatter degrades contrast." },
      { label: "TG-186 brachytherapy dosimetry", detail: "AAPM TG-186 requires model-based dose calculation (MBDCA)." },
      { label: "Synchrotron microbeam RT", detail: "Experimental synchrotron RT uses monoenergetic beams." },
      { label: "Iterative CT reconstruction", detail: "Modern iterative reconstruction algorithms model scatter." }
    ],
    formula: "σR ∝ Z² / E² (Δλ = 0, no energy transfer)",
    formulaLabel: "Rayleigh cross-section"
  },
  {
    id: "photonuclear",
    name: "Photonuclear Reaction",
    subtitle: "Giant dipole resonance",
    energy: "> 7–10 MeV",
    probability: "< 5% at 15–18 MV",
    color: "#10b981",
    glow: "#34d399",
    dark: "#064e3b",
    description: "A photon with energy exceeding the nuclear binding energy (~7–10 MeV) is absorbed by the nucleus, ejecting a neutron.",
    boardsFact: "Key (γ,n) thresholds: O-16 = 15.7 MeV, Cu-63 = 10.8 MeV, W-184 = 7.4 MeV. Tungsten collimators are major source.",
    clinicalPitfall: "Patient out-of-field neutron equivalent dose at 18 MV: 1–14 mSv/Gy depending on distance from isocenter.",
    physicsDepth: [
      "Giant Dipole Resonance: all nuclear protons oscillate collectively against all neutrons.",
      "Neutron energy spectrum: mostly 1–3 MeV evaporation neutrons + a fast-neutron tail.",
      "Photoproton (γ,p) and photodeuteron (γ,d) reactions also occur.",
      "FFF (flattening-filter-free) beams: same photonuclear rate per monitor unit as FF at equal energy.",
      "Photoneutron contamination in patient dose: falls off as ~1/r² + scatter contribution."
    ],
    clinicalApplications: [
      { label: "Linac vault re-entry procedure", detail: "After 15–18 MV use, induced activity requires delay." },
      { label: "Neutron vault shielding (NCRP 151)", detail: "15–18 MV vaults require boron-loaded polyethylene." },
      { label: "Beam energy selection protocol", detail: "Most centers: 6 MV for standard radical cases to avoid neutrons." },
      { label: "FLASH RT at high electron energies", detail: "FLASH electron beams (>40 Gy/s) produce neutrons." }
    ],
    formula: "¹⁶O(γ,n)¹⁵O threshold: 15.7 MeV",
    formulaLabel: "Reaction Threshold"
  },
  {
    id: "dnadamage",
    name: "DNA Damage & Radiobiology",
    subtitle: "Direct & indirect action",
    energy: "All therapeutic energies",
    probability: "~40 DSBs / Gy / cell",
    color: "#f43f5e",
    glow: "#fb7185",
    dark: "#881337",
    description: "Ionizing radiation kills cells through two pathways. Direct action (~30–40%): electron hits DNA. Indirect (~60-70%): •OH radical.",
    boardsFact: "Per Gy per cell: ~100,000 ionizations, ~1,000 SSBs, ~40 DSBs, ~1,000 base damages. DSBs are the lethal lesion.",
    clinicalPitfall: "•OH diffusion radius in tissue is only ~4 nm before quenching — only radicals formed near DNA matter.",
    physicsDepth: [
      "Water radiolysis products (first μs): H₂O ionized → H₂O⁺ + e⁻aq. H₂O⁺ → •OH + H⁺.",
      "Oxygen fixation hypothesis: DNA radical (DNA•) + O₂ → DNA-OO• (fixed, permanent oxidative damage).",
      "DSB repair: NHEJ (fast, error-prone, G₁ dominant) vs HR (slow, accurate, S/G₂ only).",
      "High-LET track structure: dense ionization along track produces multiple DSBs within 1–2 turns of helix.",
      "4 Rs of Radiobiology — Repair, Repopulation, Redistribution, Reoxygenation."
    ],
    clinicalApplications: [
      { label: "Fractionation from first principles", detail: "Daily 2 Gy fractions spare late-responding tissues (Repair)." },
      { label: "Accelerated repopulation", detail: "Tumor repopulation begins ~3-4 weeks into treatment (Head & Neck)." },
      { label: "SBRT biology", detail: "High single doses (≥8–10 Gy) may cause vascular damage/immunity." },
      { label: "Immunogenic cell death", detail: "RT induces immunogenic cell death (ICD) releasing DAMPs." }
    ],
    formula: "SF = e^(−αD − βD²) | BED = nd(1 + d/α/β)",
    formulaLabel: "LQ model + BED"
  }
];

const electronInteractions = [
  {
    name: "Ionization & Excitation",
    color: "#f97316",
    formula: "−dE/dx|col = Bethe-Bloch",
    detail: "The primary mechanism by which all charged particles (secondary electrons from Compton/PE) deposit dose.",
    clinicalNote: "The range of secondary Compton recoil electrons determines the dose buildup region (dmax).",
    keyNums: ["W_air = 33.97 eV per ion pair", "6 MV Compton e⁻ range: ~1.5 cm"]
  },
  {
    name: "Bremsstrahlung",
    color: "#8b5cf6",
    formula: "P_brem ∝ Z · E · N",
    detail: "A high-energy electron decelerated in the nuclear Coulomb field emits a continuous photon spectrum.",
    clinicalNote: "Bremsstrahlung efficiency η ≈ ZE/3000 %. For 6 MeV electrons on W (Z=74): ~15% efficiency.",
    keyNums: ["6 MeV on W: ~15% efficiency", "Mean photon energy ≈ E_max/3"]
  },
  {
    name: "Delta Rays (δ-rays)",
    color: "#14b8a6",
    formula: "Secondary e⁻ with high KE",
    detail: "When a primary heavy charged particle (proton, carbon ion) collides with an atomic electron, ejecting it with high energy.",
    clinicalNote: "In proton PBS (pencil beam scanning): delta rays extend laterally 1–5 mm from primary track.",
    keyNums: ["Delta ray lateral range: up to ~mm", "Dominant contributor to penumbra"]
  },
  {
    name: "Cherenkov Radiation",
    color: "#06b6d4",
    formula: "cos θc = c/nv",
    detail: "When a charged particle travels through a dielectric medium faster than the phase velocity of light in that medium.",
    clinicalNote: "Cherenkov emission during RT treatment is measurable with a CCD camera — real-time dosimetry.",
    keyNums: ["Threshold in water: ~0.26 MeV e⁻", "Blue light emission"]
  }
];

const cellCycleData = [
  { phase: "M (Mitosis)", sensitivity: 95, duration: "1 hr", reason: "DNA maximally condensed. No repair templates." },
  { phase: "G₂ (late)", sensitivity: 85, duration: "2–4 hr", reason: "G₂/M checkpoint activated. High sensitivity." },
  { phase: "G₁ (early)", sensitivity: 60, duration: "variable", reason: "p53→p21→CDK2 inhibition. Moderate sensitivity." },
  { phase: "G₁ (late)", sensitivity: 45, duration: "variable", reason: "Restriction point passed. More resistant." },
  { phase: "S (early)", sensitivity: 30, duration: "6–8 hr", reason: "Replication forks provide repair templates." },
  { phase: "S (late)", sensitivity: 20, duration: "6–8 hr", reason: "Most radioresistant. HR repair active." }
];

const repairPathways = [
  {
    name: "NHEJ",
    full: "Non-Homologous End Joining",
    speed: "Fast (min–hrs)",
    accuracy: "Error-prone",
    steps: "DSB → Ku70/Ku80 binds → DNA-PKcs → Artemis → Ligase IV",
    clinical: "NHEJ errors create chromosome translocations — the molecular basis of radiation cell kill.",
    drugs: "DNA-PKcs inhibitors (M3814) block NHEJ."
  },
  {
    name: "HR",
    full: "Homologous Recombination",
    speed: "Slow (hours)",
    accuracy: "High fidelity",
    steps: "DSB → MRN complex → CtIP resection → RAD51 filament → Sister chromatid invasion",
    clinical: "BRCA1/2 mutations impair HR → cells rely on error-prone NHEJ.",
    drugs: "PARP inhibitors trap PARP on SSBs → replication fork collapse → DSBs."
  },
  {
    name: "BER",
    full: "Base Excision Repair",
    speed: "Fast (30 min)",
    accuracy: "High fidelity",
    steps: "Damaged base → Glycosylase → AP site → APE1 → Polymerase β → Ligase",
    clinical: "Repairs radiation-induced base oxidation (8-oxoguanine).",
    drugs: "PARP inhibitors also block BER."
  }
];

// ── SVGs ─────────────────────────────────────────────────────────────────────

function PhotoelectricSVG({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 320 220" className="w-full h-full">
      <defs>
        <filter id="glow_pe"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <marker id="arrow_pe" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#f59e0b" /></marker>
      </defs>
      <circle cx="160" cy="110" r="18" fill="#f59e0b" opacity="0.9" filter="url(#glow_pe)"/>
      <text x="160" y="115" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">Nucleus</text>
      <ellipse cx="160" cy="110" rx="60" ry="30" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.6" />
      <ellipse cx="160" cy="110" rx="90" ry="45" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.4" />
      <circle cx="100" cy="110" r="6" fill="#fbbf24" filter="url(#glow_pe)">
        {active && <animate attributeName="opacity" values="1;0;0" dur="2s" repeatCount="indefinite" />}
      </circle>
      <text x="100" y="126" textAnchor="middle" fill="#fbbf24" fontSize="8">K-shell e⁻</text>
      <line x1="20" y1="110" x2="88" y2="110" stroke="#f59e0b" strokeWidth="2.5" markerEnd="url(#arrow_pe)" strokeDasharray="4 2" />
      {active && <circle r="5" fill="#fef3c7" opacity="0.9"><animateMotion path="M 20,110 L 88,110" dur="2s" repeatCount="indefinite" /></circle>}
      <text x="50" y="100" fill="#fbbf24" fontSize="9" textAnchor="middle">hν (γ)</text>
      {active && (
        <>
          <circle r="5" fill="#fbbf24" opacity="0.9" filter="url(#glow_pe)">
            <animateMotion path="M 100,110 L 280,40" dur="2s" begin="0.8s" repeatCount="indefinite" />
          </circle>
          <text x="200" y="60" fill="#fbbf24" fontSize="9">Photoelectron</text>
        </>
      )}
    </svg>
  );
}

function ComptonSVG({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 320 220" className="w-full h-full">
      <defs>
        <filter id="glow_c"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <marker id="arr_c1" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#ec4899" /></marker>
      </defs>
      <circle cx="160" cy="110" r="8" fill="#ec4899" opacity="0.9" filter="url(#glow_c)"/>
      <text x="160" y="130" textAnchor="middle" fill="#f472b6" fontSize="8">e⁻ (free)</text>
      <line x1="20" y1="110" x2="148" y2="110" stroke="#ec4899" strokeWidth="2.5" markerEnd="url(#arr_c1)" strokeDasharray="4 2" />
      {active && <circle r="5" fill="#f9a8d4" filter="url(#glow_c)"><animateMotion path="M 20,110 L 148,110" dur="2s" repeatCount="indefinite" /></circle>}
      <text x="80" y="98" fill="#ec4899" fontSize="9" textAnchor="middle">hν (incident)</text>
      <line x1="168" y1="104" x2="270" y2="30" stroke="#f472b6" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arr_c1)" />
      {active && <circle r="4" fill="#f472b6" opacity="0.8" filter="url(#glow_c)"><animateMotion path="M 168,104 L 270,30" dur="2s" begin="0.8s" repeatCount="indefinite" /></circle>}
      <text x="242" y="25" fill="#f472b6" fontSize="9">hν' (scattered)</text>
      <line x1="168" y1="116" x2="270" y2="190" stroke="#fda4af" strokeWidth="2" markerEnd="url(#arr_c1)" />
      {active && <circle r="5" fill="#fda4af" filter="url(#glow_c)"><animateMotion path="M 168,116 L 270,190" dur="2s" begin="0.8s" repeatCount="indefinite" /></circle>}
      <text x="255" y="208" fill="#fda4af" fontSize="9">Recoil e⁻</text>
    </svg>
  );
}

function PairProductionSVG({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 320 220" className="w-full h-full">
      <defs>
        <filter id="glow_pp"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <marker id="arr_pp" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#06b6d4" /></marker>
      </defs>
      <circle cx="160" cy="110" r="22" fill="#06b6d4" opacity="0.15" filter="url(#glow_pp)"/>
      <circle cx="160" cy="110" r="14" fill="#06b6d4" opacity="0.7"/>
      <text x="160" y="114" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">Nucleus</text>
      <line x1="20" y1="110" x2="135" y2="110" stroke="#06b6d4" strokeWidth="3" markerEnd="url(#arr_pp)" strokeDasharray="4 2" />
      {active && <circle r="6" fill="#a5f3fc" filter="url(#glow_pp)"><animateMotion path="M 20,110 L 135,110" dur="2s" repeatCount="indefinite" /></circle>}
      <text x="75" y="100" fill="#06b6d4" fontSize="9" textAnchor="middle">hν &gt; 1.022 MeV</text>
      <line x1="175" y1="104" x2="290" y2="45" stroke="#22d3ee" strokeWidth="2" markerEnd="url(#arr_pp)" />
      {active && <circle r="5" fill="#22d3ee" filter="url(#glow_pp)"><animateMotion path="M 175,104 L 290,45" dur="2s" begin="0.8s" repeatCount="indefinite" /></circle>}
      <text x="285" y="38" fill="#22d3ee" fontSize="9">e⁻</text>
      <line x1="175" y1="116" x2="260" y2="175" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#arr_pp)" />
      {active && <circle r="5" fill="#a78bfa" filter="url(#glow_pp)"><animateMotion path="M 175,116 L 260,175" dur="2s" begin="0.8s" repeatCount="indefinite" /></circle>}
      <text x="262" y="185" fill="#a78bfa" fontSize="9">e⁺ (positron)</text>
    </svg>
  );
}

function CoherentSVG({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 320 220" className="w-full h-full">
      <defs><filter id="glow_coh"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <circle cx="160" cy="110" r="14" fill="#7c3aed" opacity="0.9" filter="url(#glow_coh)"/>
      <text x="160" y="114" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">Atom</text>
      <circle cx="160" cy="110" r="48" fill="none" stroke="#a78bfa" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
      {[0,1,2,3].map(i=><circle key={i} cx={40+i*18} cy={110} r={6} fill="none" stroke="#7c3aed" strokeWidth="1.5" opacity={0.5} />)}
      {active && <circle r="6" fill="#7c3aed" opacity="0.5"><animateMotion path="M 40,110 L 140,110" dur="1.5s" repeatCount="indefinite" /></circle>}
      <text x="50" y="95" fill="#a78bfa" fontSize="9" textAnchor="middle">hν (in)</text>
      <text x="280" y="55" fill="#c4b5fd" fontSize="9">hν' (same λ)</text>
    </svg>
  );
}

function PhotonuclearSVG({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 320 220" className="w-full h-full">
      <defs>
        <filter id="glow_pn"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <marker id="arr_pn" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#10b981" /></marker>
      </defs>
      <circle cx="160" cy="110" r="28" fill="#10b981" opacity="0.15" filter="url(#glow_pn)" />
      <circle cx="160" cy="110" r="20" fill="#10b981" opacity="0.5" />
      <text x="160" y="142" textAnchor="middle" fill="#10b981" fontSize="9">Z,A nucleus</text>
      <line x1="20" y1="90" x2="133" y2="90" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arr_pn)" strokeDasharray="4 2" />
      {active && <circle r="5" fill="#6ee7b7" filter="url(#glow_pn)"><animateMotion path="M 20,90 L 133,90" dur="2s" repeatCount="indefinite" /></circle>}
      <text x="75" y="80" fill="#10b981" fontSize="9" textAnchor="middle">hν &gt; 7–10 MeV</text>
      <line x1="180" y1="95" x2="290" y2="45" stroke="#34d399" strokeWidth="2" markerEnd="url(#arr_pn)" />
      {active && <circle r="6" fill="#34d399" filter="url(#glow_pn)"><animateMotion path="M 180,95 L 290,45" dur="2s" begin="0.8s" repeatCount="indefinite" /></circle>}
      <text x="288" y="38" fill="#34d399" fontSize="9">n (neutron)</text>
    </svg>
  );
}

function DNADamageSVG({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 320 220" className="w-full h-full">
      <defs>
        <filter id="glow_dna"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <marker id="arr_dna1" markerWidth="7" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0 L0,5 L7,2.5 z" fill="#f43f5e" /></marker>
      </defs>
      {Array.from({length:8}).map((_,i)=>{
        const y=30+i*22;
        return <rect key={i} x="160" y={y} width="40" height="6" rx="3" fill="#334155" opacity="0.3" transform={`rotate(15, 180, ${y+3})`} />
      })}
      <line x1="30" y1="80" x2="105" y2="80" stroke="#f43f5e" strokeWidth="2.5" markerEnd="url(#arr_dna1)" strokeDasharray="4 2" />
      {active && <circle r="4" fill="#f43f5e" filter="url(#glow_dna)"><animateMotion path="M 30,80 L 105,80" dur="1.5s" repeatCount="indefinite" /></circle>}
      <text x="60" y="70" fill="#f43f5e" fontSize="8" textAnchor="middle" fontWeight="bold">Direct Action</text>
      <circle cx="220" cy="110" r="14" fill="#3b82f6" opacity="0.3"/>
      <text x="220" y="107" textAnchor="middle" fill="#93c5fd" fontSize="8" fontWeight="bold">H₂O</text>
      {active && <circle cx="220" cy="110" r="14" fill="none" stroke="#fbbf24" strokeWidth="2"><animate attributeName="r" values="14;20;14" dur="1.5s" repeatCount="indefinite" /></circle>}
      <text x="246" y="90" fill="#fbbf24" fontSize="10" fontWeight="bold" filter="url(#glow_dna)">•OH</text>
      <text x="215" y="130" fill="#fbbf24" fontSize="8" textAnchor="middle">Indirect (~70%)</text>
    </svg>
  );
}

const SVG_MAP: Record<string, React.FC<{ active: boolean }>> = {
  photoelectric: PhotoelectricSVG,
  compton: ComptonSVG,
  pairproduction: PairProductionSVG,
  coherent: CoherentSVG,
  photonuclear: PhotonuclearSVG,
  dnadamage: DNADamageSVG
};

function EnergyScale({ activeId }: { activeId: string }) {
  const bands = [
    { x: 0, w: 22, color: "#f59e0b", label: "Photoelectric", id: "photoelectric" },
    { x: 22, w: 38, color: "#ec4899", label: "Compton", id: "compton" },
    { x: 60, w: 40, color: "#06b6d4", label: "Pair Production", id: "pairproduction" }
  ];
  const marks = [
    { label: "1 keV", x: 4 },
    { label: "100 keV", x: 30 },
    { label: "1 MeV", x: 55 },
    { label: "10 MeV", x: 85 }
  ];
  return (
    <div className="relative w-full h-16 rounded-2xl overflow-hidden bg-slate-900/50 border border-slate-700/50">
      {bands.map(b => (
        <div key={b.id} className="absolute top-0 h-full transition-all duration-500"
             style={{
               left: `${b.x}%`, width: `${b.w}%`,
               background: activeId === b.id ? b.color : `${b.color}20`,
               opacity: activeId === b.id ? 0.8 : 0.3
             }} />
      ))}
      <div className="absolute bottom-4 left-2 right-2 h-px bg-slate-600 opacity-40" />
      {marks.map(m => (
        <div key={m.label} className="absolute bottom-3" style={{ left: `${m.x}%` }}>
          <div className="h-2 w-px bg-slate-400 mx-auto mb-1" />
          <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap -ml-3">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function RadiationMechanismPage() {
  const [active, setActive] = useState("compton");
  const [animating, setAnimating] = useState(true);
  const [tab, setTab] = useState<"physics" | "clinical" | "pitfall">("physics");
  const [elTab, setElTab] = useState(0);
  const [repairTab, setRepairTab] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const m = mechanisms.find(x => x.id === active) || mechanisms[0];
  const SVGComponent = SVG_MAP[active];

  return (
    <div className="min-h-screen pb-16 bg-slate-950 text-slate-100">
      {/* HEADER */}
      <div className="px-5 pt-7 pb-3 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-600">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Radiation Mechanisms</h1>
            <p className="text-[11px] text-slate-400 uppercase tracking-widest">Interactions & Radiobiology</p>
          </div>
        </div>
      </div>

      {/* SELECTOR */}
      <div className="px-5 max-w-6xl mx-auto mb-3">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {mechanisms.map(mech => (
            <button key={mech.id} onClick={() => { setActive(mech.id); setTab("physics"); }}
              className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all border border-transparent"
              style={{
                background: active === mech.id ? mech.color : "rgba(30,41,59,0.5)",
                color: active === mech.id ? "#fff" : "#94a3b8",
                borderColor: active === mech.id ? mech.glow : "transparent"
              }}
            >
              {mech.name}
            </button>
          ))}
        </div>
      </div>

      {/* ENERGY SCALE */}
      <div className="px-5 max-w-6xl mx-auto mb-4">
        <EnergyScale activeId={active} />
      </div>

      {/* MAIN 2-COL */}
      <div className="px-5 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* SVG Panel */}
        <div className="lg:col-span-2 rounded-3xl overflow-hidden relative border border-slate-800" style={{ background: `linear-gradient(145deg, ${m.dark}20, #0f172a)` }}>
          <div className="px-5 pt-5 pb-2 relative z-10 flex items-start justify-between">
            <div>
              <div style={{ color: m.color, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "900" }}>{m.subtitle}</div>
              <div className="text-white font-bold text-lg">{m.name}</div>
            </div>
            <button onClick={() => setAnimating(!animating)} className="px-3 py-1.5 rounded-xl bg-slate-800/50 text-xs font-mono text-slate-300 hover:bg-slate-700 transition">
              {animating ? "Pause" : "Play"}
            </button>
          </div>
          <div className="px-4 pb-2 relative z-10 h-52">
            <SVGComponent active={animating} />
          </div>
          <div className="px-5 py-3 border-t border-slate-800/50 relative z-10 grid grid-cols-2 gap-3 bg-slate-900/30">
            <div>
              <div style={{ color: m.color, fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "bold" }}>Energy Range</div>
              <div className="text-slate-300 text-xs font-mono">{m.energy}</div>
            </div>
            <div>
              <div style={{ color: m.color, fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "bold" }}>Probability</div>
              <div className="text-slate-300 text-xs font-mono">{m.probability}</div>
            </div>
            <div className="col-span-2">
              <div style={{ color: m.color, fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "bold" }}>{m.formulaLabel}</div>
              <div className="text-white text-xs font-mono bg-slate-950/50 p-1.5 rounded border border-slate-800 mt-1">{m.formula}</div>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="flex gap-1 p-1 rounded-2xl bg-slate-900/80 border border-slate-800">
            {[
              { id: "physics", label: "Physics Depth" },
              { id: "clinical", label: "Clinical Use" },
              { id: "pitfall", label: "Boards Pitfall" }
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${tab === t.id ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="rounded-3xl p-5 flex-1 border border-slate-800 bg-slate-900/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {tab === "physics" && (
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: m.color }}>Mechanism Detail</div>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">{m.description}</p>
                    <div className="space-y-2">
                      {m.physicsDepth.map((pt, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800/50">
                          <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: m.color }} />
                          <p className="text-slate-300 text-xs leading-relaxed">{pt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tab === "clinical" && (
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: m.color }}>Clinical Applications</div>
                    <div className="space-y-3">
                      {m.clinicalApplications.map((app, i) => (
                        <div key={i} className="rounded-2xl p-4 border border-slate-800/50" style={{ background: `${m.dark}20` }}>
                          <div className="font-bold mb-1.5 text-sm" style={{ color: m.glow }}>{app.label}</div>
                          <p className="text-slate-400 text-xs leading-relaxed">{app.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tab === "pitfall" && (
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: m.color }}>Exam High-Yield</div>
                    <div className="rounded-2xl p-4 mb-4 bg-emerald-900/10 border border-emerald-900/30">
                      <div className="text-xs font-black uppercase tracking-widest mb-2 text-emerald-500">Key Fact</div>
                      <p className="text-emerald-100 text-sm leading-relaxed">{m.boardsFact}</p>
                    </div>
                    <div className="rounded-2xl p-4 bg-rose-900/10 border border-rose-900/30">
                      <div className="text-xs font-black uppercase tracking-widest mb-2 text-rose-500">Common Pitfall</div>
                      <p className="text-rose-100 text-sm leading-relaxed">{m.clinicalPitfall}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── ELECTRON INTERACTIONS ───────────────────────────────────────────── */}
      <div className="px-5 max-w-6xl mx-auto mt-7">
        <div className="rounded-3xl overflow-hidden bg-slate-900/50 border border-slate-800">
          <div className="px-6 py-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">Charged Particle Interactions</h2>
                <p className="text-slate-500 text-[10px] font-mono">Secondary electrons & heavy ions</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {electronInteractions.map((ei, i) => (
                <button key={i} onClick={() => setElTab(i)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${elTab === i ? "bg-slate-800 text-white" : "bg-slate-950/50 text-slate-500 hover:text-slate-300"}`}
                  style={{ color: elTab === i ? ei.color : undefined }}
                >
                  {ei.name}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: electronInteractions[elTab].color }}>Mechanism</div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">{electronInteractions[elTab].detail}</p>
              <div className="rounded-2xl p-4 bg-slate-950/50 border border-slate-800">
                <div className="text-xs font-black uppercase tracking-widest mb-2 text-slate-500">Clinical Relevance</div>
                <p className="text-slate-300 text-xs leading-relaxed">{electronInteractions[elTab].clinicalNote}</p>
              </div>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: electronInteractions[elTab].color }}>Key Values</div>
              <div className="space-y-2.5">
                {electronInteractions[elTab].keyNums.map((n, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: electronInteractions[elTab].color }} />
                    <p className="text-slate-300 text-xs font-mono">{n}</p>
                  </div>
                ))}
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 mt-2">
                  <div className="text-[9px] uppercase font-bold text-slate-500">Formula</div>
                  <div className="font-mono font-bold mt-1 text-xs text-white">{electronInteractions[elTab].formula}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CELL CYCLE ──────────────────────────────────────────────────────── */}
      <div className="px-5 max-w-6xl mx-auto mt-5">
        <div className="rounded-3xl overflow-hidden bg-slate-900/50 border border-slate-800">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="font-bold text-white text-sm">Cell Cycle Radiosensitivity</h2>
            <p className="text-slate-500 text-[10px] font-mono">Phase-specific response (Law of Bergonie & Tribondeau)</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {cellCycleData.map((phase, i) => (
                <div key={i} className="grid gap-3 items-center" style={{ gridTemplateColumns: "80px 1fr 150px" }}>
                  <span className="font-bold text-xs text-right text-rose-500 font-mono">{phase.phase}</span>
                  <div className="h-4 rounded-full overflow-hidden bg-slate-800 relative">
                    <div className="h-full rounded-full bg-gradient-to-r from-rose-900 to-rose-500" style={{ width: `${phase.sensitivity}%` }} />
                  </div>
                  <p className="text-slate-500 text-[10px] leading-tight">{phase.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── DNA REPAIR ──────────────────────────────────────────────────────── */}
      <div className="px-5 max-w-6xl mx-auto mt-5">
        <div className="rounded-3xl overflow-hidden bg-slate-900/50 border border-slate-800">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white text-sm">DNA Repair Pathways</h2>
              <p className="text-slate-500 text-[10px] font-mono">Molecular mechanisms of survival</p>
            </div>
            <div className="flex gap-2">
              {repairPathways.map((rp, i) => (
                <button key={i} onClick={() => setRepairTab(i)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${repairTab === i ? "bg-slate-800 text-white" : "bg-slate-950 text-slate-500"}`}
                >
                  {rp.name}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex gap-2 mb-4">
                {[
                  { label: "Speed", val: repairPathways[repairTab].speed },
                  { label: "Accuracy", val: repairPathways[repairTab].accuracy }
                ].map((k, idx) => (
                  <div key={idx} className="flex-1 rounded-xl p-2.5 text-center bg-slate-950 border border-slate-800">
                    <div className="text-[8px] uppercase font-bold text-slate-500">{k.label}</div>
                    <div className="font-bold mt-0.5 text-sm text-white">{k.val}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs font-black uppercase tracking-widest mb-2 text-slate-500">Steps</div>
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                <p className="text-slate-400 text-xs font-mono leading-relaxed">{repairPathways[repairTab].steps}</p>
              </div>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest mb-3 text-slate-500">Clinical Impact</div>
              <div className="rounded-2xl p-4 mb-3 bg-slate-800/30 border border-slate-700/30">
                <p className="text-slate-200 text-xs leading-relaxed">{repairPathways[repairTab].clinical}</p>
              </div>
              <div className="rounded-2xl p-4 bg-rose-900/10 border border-rose-900/20">
                <div className="text-[10px] font-black uppercase tracking-widest mb-1 text-rose-500">Targeted Therapy</div>
                <p className="text-rose-200 text-xs leading-relaxed">{repairPathways[repairTab].drugs}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reference Sidebar */}
      <KeyFactsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpen={() => setIsSidebarOpen(true)}
        data={SIDEBAR_DATA}
      >
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <p className="text-xs text-slate-500 leading-relaxed italic">
            *Physics constants based on standard water phantom interactions.
          </p>
        </div>
      </KeyFactsSidebar>

      {/* FOOTER */}
      <div className="px-5 max-w-6xl mx-auto mt-6 text-center pb-8">
        <p className="text-slate-600 text-[10px] font-mono tracking-wide">
          References: Khan's Physics of Radiation Therapy (5th ed.) · Hall & Giaccia Radiobiology
          <br />For resident training only · Not for direct clinical decision-making
        </p>
      </div>
    </div>
  );
}
