export const formatPercentage = (value: number, fractionDigits = 0) => {
  const percentage = Number.isFinite(value) ? value : 0;
  return `${(percentage * 100).toFixed(fractionDigits)}%`;
};
