export interface TimeFormat {
  time: string;
  raw: string;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface HoursFormat {
  raw: number;
  formatted: string;
  hours: number;
  minutes: number;
  totalMinutes: number;
}

export interface DateFormat {
  dateTime: string;
  time: string;
  time24: string;
  date: string;
  dateStandard: string;
  dateFull: string;
  raw: Date;
  timeAgo: string;
  day: string;
  daySmall: string;
}

export interface CurrencyFormat {
  formatName: string;
  formatCurrency: string;
  formatNumber: string;
  raw: number;
}

export interface PercentageFormat {
  formatPercentage: string;
  formatNumber: string;
  raw: number;
}
