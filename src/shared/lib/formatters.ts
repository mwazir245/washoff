export const formatSar = (amount: number) => {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (value: number) => {
  return new Intl.NumberFormat("ar-SA").format(value);
};

export const formatPercent = (ratio: number, maximumFractionDigits = 0) => {
  return new Intl.NumberFormat("ar-SA", {
    style: "percent",
    maximumFractionDigits,
  }).format(ratio);
};

export const formatDateLabel = (value: string) => {
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
};

export const formatDateTimeLabel = (value: string) => {
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const formatDurationLabel = (totalSeconds: number) => {
  if (totalSeconds < 60) {
    return `${formatNumber(Math.round(totalSeconds))} ثانية`;
  }

  const totalMinutes = totalSeconds / 60;

  if (totalMinutes < 60) {
    return `${formatNumber(Math.round(totalMinutes))} دقيقة`;
  }

  return `${formatNumber(Math.round(totalMinutes / 60))} ساعة`;
};
