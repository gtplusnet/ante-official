export const formatCurrency = (
  value: number | string,
  decimalPlaces: number = 2,
  zeroToDash: boolean = false
): string => {
  return '₱' + formatNumber(value, decimalPlaces, zeroToDash);
};

export const formatCurrencyShort = (value: number | string): string => {
  return '₱' + formatNumberShort(value);
};

export const formatNumberShort = (value: number | string): string => {
  if (value === null || value === undefined) {
    return '0';
  }

  const numberValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numberValue)) {
    return '0';
  }

  // Handle negative numbers
  const isNegative = numberValue < 0;
  const absValue = Math.abs(numberValue);

  let formattedValue: string;

  if (absValue >= 1000000) {
    // Millions
    formattedValue = (absValue / 1000000).toFixed(absValue >= 10000000 ? 0 : 1) + 'M';
  } else if (absValue >= 1000) {
    // Thousands
    formattedValue = (absValue / 1000).toFixed(absValue >= 10000 ? 0 : 1) + 'K';
  } else {
    // Less than 1000, show as is
    formattedValue = absValue.toFixed(0);
  }

  // Remove unnecessary decimal zeros
  formattedValue = formattedValue.replace(/\.0([KM])$/, '$1');

  return (isNegative ? '-' : '') + formattedValue;
};

export const formatNumber = (
  value: number | string,
  decimalPlaces: number = 2,
  zeroToDash: boolean = false
): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (zeroToDash) {
    const numberValueIsZero = value === 0 ? true : false;

    if (numberValueIsZero) {
      return '-';
    }
  }

  const numberValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numberValue)) {
    return '';
  }

  return numberValue.toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
};

export const formatWord = (value: string): string => {
  if (!value) {
    return '';
  }

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

export const formatName = (name: string | undefined) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formats lead board stage keys like 'technical_meeting' to 'Technical Meeting'
 * Replaces underscores with spaces and capitalizes each word
 */
export const formatLeadStage = (stage: string | undefined): string => {
  if (!stage) return '';

  return stage
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const TEXT_TRUNCATION = {
  NOTIFICATION_CONTENT: 60,
  REJECTION_REASON: 65,
  DEFAULT: 45
} as const;

export const truncate = (text: string, type: keyof typeof TEXT_TRUNCATION = 'DEFAULT'): string => {
  const maxLength = TEXT_TRUNCATION[type];
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

export const formatDate = (dateInput: string | { raw: Date }): string => {
  let date: Date;
  
  if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else if (dateInput && typeof dateInput === 'object' && 'raw' in dateInput) {
    date = dateInput.raw;
  } else {
    throw new Error('Invalid date input');
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatTime = (dateInput: string | Date | { raw: Date }): string => {
  let date: Date;

  if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else if (dateInput && typeof dateInput === 'object' && 'raw' in dateInput) {
    date = dateInput.raw;
  } else {
    date = dateInput as Date;
  }

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date input for time formatting');
  }

  // Use UTC methods to extract time without timezone conversion
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Formats date to long format: "October 8, 2025"
 * @param dateInput ISO date string or Date object
 * @returns Formatted date string in "Month Day, Year" format
 */
export const formatLongDate = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  if (isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};
