import { describe, expect, it } from 'vitest';
import {
  addDays,
  clinicLocalToInstant,
  daysInRangeInclusive,
  endOfClinicDayExclusive,
  formatClockTime,
  isValidClockTime,
  isValidDate,
  parseClockTime,
  startOfClinicDay,
  toClinicLocalTime,
} from '../../../src/rules/clinic-time.rules';

describe('clinic-time (RN06)', () => {
  it('converte um instante UTC para o relogio local da clinica', () => {
    // 2026-10-13 e terca-feira; 13:00Z = 10:00 em Sao Paulo
    expect(toClinicLocalTime(new Date('2026-10-13T13:00:00Z'))).toEqual({
      date: '2026-10-13',
      weekDay: 2,
      minutesOfDay: 600,
    });
  });

  it('considera a virada do dia no fuso local', () => {
    // 02:00Z de quarta ainda e 23:00 de terca em Sao Paulo
    expect(toClinicLocalTime(new Date('2026-10-14T02:00:00Z'))).toMatchObject({ date: '2026-10-13', weekDay: 2 });
  });

  it('converte data e hora local para o instante UTC', () => {
    expect(clinicLocalToInstant('2026-10-13', 8 * 60).toISOString()).toBe('2026-10-13T11:00:00.000Z');
    expect(startOfClinicDay('2026-10-13').toISOString()).toBe('2026-10-13T03:00:00.000Z');
    expect(endOfClinicDayExclusive('2026-10-13').toISOString()).toBe('2026-10-14T03:00:00.000Z');
  });

  it('valida datas YYYY-MM-DD de calendario', () => {
    expect(isValidDate('2026-10-13')).toBe(true);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026/10/13')).toBe(false);
    expect(isValidDate('13-10-2026')).toBe(false);
  });

  it('soma dias e conta o intervalo incluindo as duas pontas', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(daysInRangeInclusive('2026-10-12', '2026-10-16')).toBe(5);
    expect(daysInRangeInclusive('2026-10-12', '2026-10-12')).toBe(1);
    expect(daysInRangeInclusive('2026-10-16', '2026-10-12')).toBe(-3);
  });

  it('le e formata horas HH:MM', () => {
    expect(isValidClockTime('08:00')).toBe(true);
    expect(isValidClockTime('8:00')).toBe(false);
    expect(isValidClockTime('24:00')).toBe(false);
    expect(parseClockTime('14:30')).toBe(870);
    expect(formatClockTime(870)).toBe('14:30');
    expect(formatClockTime(0)).toBe('00:00');
  });

  it('recusa hora e data fora do formato', () => {
    expect(() => parseClockTime('25:00')).toThrow();
    expect(() => addDays('2026/10/13', 1)).toThrow();
  });
});
