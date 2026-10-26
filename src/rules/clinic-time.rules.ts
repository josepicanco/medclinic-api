// RN06: a escala e hora local da clinica. As conversoes usam Intl para nao depender
// do fuso do servidor nem de um offset fixo.
export const CLINIC_TIME_ZONE = 'America/Sao_Paulo';

const MS_PER_DAY = 24 * 60 * 60_000;
const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const CLOCK_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CLINIC_TIME_ZONE,
  hourCycle: 'h23',
  weekday: 'short',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export interface ClinicLocalTime {
  readonly date: string;
  readonly weekDay: number;
  readonly minutesOfDay: number;
}

function localParts(instant: Date): Record<string, string> {
  const parts: Record<string, string> = {};

  for (const part of formatter.formatToParts(instant)) {
    parts[part.type] = part.value;
  }

  return parts;
}

export function toClinicLocalTime(instant: Date): ClinicLocalTime {
  const parts = localParts(instant);

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekDay: WEEKDAYS[parts.weekday] ?? 0,
    minutesOfDay: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function clinicOffsetMs(instant: Date): number {
  const parts = localParts(instant);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

// data local + minutos do dia -> instante UTC
export function clinicLocalToInstant(date: string, minutesOfDay = 0): Date {
  const [year, month, day] = parseDate(date);
  const wallClock = Date.UTC(year, month - 1, day, 0, minutesOfDay);
  const firstGuess = wallClock - clinicOffsetMs(new Date(wallClock));

  return new Date(wallClock - clinicOffsetMs(new Date(firstGuess)));
}

export function startOfClinicDay(date: string): Date {
  return clinicLocalToInstant(date, 0);
}

// inicio do dia seguinte, usado como limite exclusivo
export function endOfClinicDayExclusive(date: string): Date {
  return clinicLocalToInstant(addDays(date, 1), 0);
}

export function isValidDate(date: string): boolean {
  const match = DATE_PATTERN.exec(date);

  if (!match) {
    return false;
  }

  const instant = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return instant.toISOString().slice(0, 10) === date;
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = parseDate(date);
  return new Date(Date.UTC(year, month - 1, day) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

// conta as duas pontas
export function daysInRangeInclusive(from: string, to: string): number {
  const [fromYear, fromMonth, fromDay] = parseDate(from);
  const [toYear, toMonth, toDay] = parseDate(to);
  const diff = Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay);

  return Math.round(diff / MS_PER_DAY) + 1;
}

export function isValidClockTime(value: string): boolean {
  return CLOCK_TIME_PATTERN.test(value);
}

// "HH:MM" -> minutos desde 00:00
export function parseClockTime(value: string): number {
  const match = CLOCK_TIME_PATTERN.exec(value);

  if (!match) {
    throw new Error(`Hora inválida: ${value}`);
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

// minutos desde 00:00 -> "HH:MM"
export function formatClockTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function parseDate(date: string): [number, number, number] {
  const match = DATE_PATTERN.exec(date);

  if (!match) {
    throw new Error(`Data inválida: ${date}`);
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}
