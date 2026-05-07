const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export function formatBytes(bytes, options = {}) {
  const locale = options.locale ?? 'pt-BR';
  const preferredUnit = options.preferredUnit ?? null;
  const maximumFractionDigits = options.maximumFractionDigits ?? 1;
  const minimumFractionDigits = options.minimumFractionDigits ?? 0;

  const numericBytes = Number(bytes);
  if (!Number.isFinite(numericBytes) || numericBytes <= 0) {
    if (preferredUnit) {
      return `0 ${preferredUnit}`;
    }
    return '0 B';
  }

  const base = 1024;
  let index = Math.min(Math.floor(Math.log(numericBytes) / Math.log(base)), UNITS.length - 1);

  if (preferredUnit) {
    const forcedIndex = UNITS.indexOf(preferredUnit);
    if (forcedIndex >= 0) {
      index = forcedIndex;
    }
  }

  const value = numericBytes / (base ** index);
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: index === 0 ? 0 : maximumFractionDigits,
    minimumFractionDigits: index === 0 ? 0 : minimumFractionDigits,
  });

  return `${formatter.format(value)} ${UNITS[index]}`;
}

