import { saveHistory, getHistory } from '../lib/db';

/**
 * @deprecated Use src/lib/db.ts instead
 */
export const saveCalculation = async (data: any) => {
  return saveHistory({
    calculatorId: data.module || 'unknown',
    calculatorName: data.module || 'Calculation',
    inputs: data.inputs || {},
    outputs: data.outputs || {},
    flags: data.flag === 'fail' ? ['fail'] : [],
    version: '0.0.0',
    timestamp: Date.now()
  });
};

/**
 * @deprecated Use src/lib/db.ts instead
 */
export const getRecentCalculations = async (limit = 50): Promise<any[]> => {
  const history = await getHistory();
  return history.slice(0, limit);
};
