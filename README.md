# Rad Calc Pro 2

Clinical Radiobiology Portal. Evidence-based Radiation Oncology calculators: BED/EQD2, HDR Brachytherapy, OAR constraints, Gap Correction, Re-irradiation.

## Running the App

### Google AI Studio (no build step)
Upload all project files. The app uses the importmap in index.html
to resolve modules via esm.sh CDN. No npm install needed.

### Local development (Vite)
```bash
npm install
npm run dev       # starts Vite dev server on port 3000
npm run build     # production build to /dist
```
Note: vite.config.ts is only active in this mode.
