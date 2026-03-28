import { checkClinicalAlerts, AlertInputs } from './clinicalAlerts';

/**
 * Simple test runner for clinical alerts
 */
function runTests() {
  console.log('--- Starting Clinical Alerts Tests ---');

  const testCases: { name: string; inputs: AlertInputs; expectedAlertId?: string; shouldBeEmpty?: boolean }[] = [
    {
      name: 'Prostate α/β Warning (α/β=10)',
      inputs: { alphaBeta: 10, dosePerFx: 2, fractions: 37, totalDose: 74, site: 'Genitourinary', subsite: 'Prostate' },
      expectedAlertId: 'prostate-ab-warning'
    },
    {
      name: 'Prostate α/β Range Awareness (α/β=1.5)',
      inputs: { alphaBeta: 1.5, dosePerFx: 2, fractions: 37, totalDose: 74, bed: 172.7, eqd2: 74, site: 'Genitourinary', subsite: 'Prostate' },
      expectedAlertId: 'prostate-ab-range'
    },
    {
      name: 'SBRT Physics QA Alert',
      inputs: { alphaBeta: 10, dosePerFx: 10, fractions: 5, totalDose: 50 },
      expectedAlertId: 'sbrt-qa'
    },
    {
      name: 'Extreme Hypofractionation Alert',
      inputs: { alphaBeta: 10, dosePerFx: 12, fractions: 3, totalDose: 36 },
      expectedAlertId: 'extreme-hypo'
    },
    {
      name: 'OAR Alert (High EQD2)',
      inputs: { alphaBeta: 3, dosePerFx: 2, fractions: 50, totalDose: 100, eqd2: 100 },
      expectedAlertId: 'oar-constraints'
    },
    {
      name: 'High Dose-per-Fx (Not SBRT)',
      inputs: { alphaBeta: 10, dosePerFx: 6, fractions: 15, totalDose: 90, isSBRT: false },
      expectedAlertId: 'high-dpf-not-sbrt'
    },
    {
      name: 'Unusual Fractions',
      inputs: { alphaBeta: 10, dosePerFx: 1.8, fractions: 45, totalDose: 81 },
      expectedAlertId: 'unusual-fractions'
    },
    {
      name: 'Standard Schedule (No Alerts)',
      inputs: { alphaBeta: 10, dosePerFx: 2, fractions: 30, totalDose: 60 },
      shouldBeEmpty: true
    }
  ];

  let passed = 0;
  testCases.forEach(tc => {
    const alerts = checkClinicalAlerts(tc.inputs);
    
    if (tc.shouldBeEmpty) {
      if (alerts.length === 0) {
        console.log(`✅ PASS: ${tc.name}`);
        passed++;
      } else {
        console.error(`❌ FAIL: ${tc.name} - Expected 0 alerts, got ${alerts.length}`);
      }
    } else {
      const hasExpected = alerts.some(a => a.id === tc.expectedAlertId);
      if (hasExpected) {
        console.log(`✅ PASS: ${tc.name}`);
        passed++;
      } else {
        console.error(`❌ FAIL: ${tc.name} - Expected alert ID "${tc.expectedAlertId}" not found. Found: [${alerts.map(a => a.id).join(', ')}]`);
      }
    }
  });

  console.log(`--- Tests Finished: ${passed}/${testCases.length} Passed ---`);
}

// Run tests if this script is executed
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  runTests();
}

export { runTests };
