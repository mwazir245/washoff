export interface NumericRange {
  min: number;
  max: number;
}

export const clampNormalizedScore = (value: number) => {
  return Math.min(Math.max(value, 0), 1);
};

export const roundScore = (value: number, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const buildNumericRange = (values: number[]): NumericRange => {
  if (values.length === 0) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
};

export const normalizeHigherIsBetter = (value: number, range: NumericRange) => {
  if (range.max === range.min) {
    return 1;
  }

  return clampNormalizedScore((value - range.min) / (range.max - range.min));
};

export const normalizeLowerIsBetter = (value: number, range: NumericRange) => {
  if (range.max === range.min) {
    return 1;
  }

  return clampNormalizedScore((range.max - value) / (range.max - range.min));
};

export const toPercentageScore = (normalizedValue: number) => {
  return roundScore(clampNormalizedScore(normalizedValue) * 100);
};
