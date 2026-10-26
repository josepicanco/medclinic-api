import { describe, expect, it } from 'vitest';
import { addMinutes, periodsOverlap } from '../../../src/rules/period.rules';

const at = (hhmm: string): Date => new Date(`2026-10-13T${hhmm}:00-03:00`);
const period = (start: string, end: string) => ({ startsAt: at(start), endsAt: at(end) });

describe('periodsOverlap (RN08/RN09)', () => {
  const base = period('10:00', '10:30');

  it('nao conflita quando um termina antes do outro comecar', () => {
    expect(periodsOverlap(base, period('11:00', '11:30'))).toBe(false);
  });

  it('nao conflita quando um comeca depois do outro terminar', () => {
    expect(periodsOverlap(base, period('09:00', '09:30'))).toBe(false);
  });

  it('nao conflita quando estao encostados (comparacao estrita)', () => {
    expect(periodsOverlap(base, period('10:30', '11:00'))).toBe(false);
    expect(periodsOverlap(base, period('09:30', '10:00'))).toBe(false);
  });

  it('conflita quando um esta dentro do outro', () => {
    expect(periodsOverlap(period('09:00', '12:00'), base)).toBe(true);
    expect(periodsOverlap(base, period('10:10', '10:20'))).toBe(true);
  });

  it('conflita quando cruzam a borda, mesmo com inicios diferentes', () => {
    expect(periodsOverlap(base, period('10:20', '10:50'))).toBe(true);
    expect(periodsOverlap(base, period('09:50', '10:10'))).toBe(true);
  });

  it('conflita quando os periodos sao iguais', () => {
    expect(periodsOverlap(base, period('10:00', '10:30'))).toBe(true);
  });
});

describe('addMinutes', () => {
  it('soma minutos a um instante', () => {
    expect(addMinutes(at('10:00'), 30).toISOString()).toBe('2026-10-13T13:30:00.000Z');
  });
});
