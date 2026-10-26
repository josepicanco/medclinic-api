import { describe, expect, it } from 'vitest';

import {
  ShiftTime,
  findShiftForSlot,
  hasOverlappingShifts,
  isShiftWellFormed,
  shiftsOverlap,
} from '../../../src/rules/schedule.rules';

function shift(weekDay: number, start: string, end: string, slot: number): ShiftTime {
  const toMinutes = (time: string): number => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  return { weekDay, startMinutes: toMinutes(start), endMinutes: toMinutes(end), slotDurationMinutes: slot };
}

describe('validacao da escala (RN05)', () => {
  it('rejeita turnos sobrepostos no mesmo dia da semana', () => {
    expect(hasOverlappingShifts([shift(2, '08:00', '12:00', 30), shift(2, '11:00', '14:00', 30)])).toBe(true);
  });

  it('aceita turnos encostados', () => {
    expect(hasOverlappingShifts([shift(2, '12:00', '18:00', 20), shift(2, '08:00', '12:00', 30)])).toBe(false);
  });

  it('aceita o mesmo horario em dias diferentes', () => {
    expect(shiftsOverlap(shift(2, '08:00', '12:00', 30), shift(4, '08:00', '12:00', 30))).toBe(false);
    expect(hasOverlappingShifts([shift(2, '08:00', '12:00', 30), shift(4, '08:00', '12:00', 30)])).toBe(false);
  });

  it('aceita escala vazia', () => {
    expect(hasOverlappingShifts([])).toBe(false);
  });

  it('confere se o turno esta bem formado', () => {
    expect(isShiftWellFormed(shift(2, '08:00', '12:00', 30))).toBe(true);
    expect(isShiftWellFormed(shift(7, '08:00', '12:00', 30))).toBe(false);
    expect(isShiftWellFormed({ ...shift(2, '08:00', '12:00', 30), weekDay: -1 })).toBe(false);
    expect(isShiftWellFormed(shift(2, '12:00', '12:00', 30))).toBe(false);
    expect(isShiftWellFormed(shift(2, '08:00', '12:00', 0))).toBe(false);
  });
});

describe('horario existe na escala (RN07)', () => {
  // terca 08-12 com 30 min e 14-18 com 20 min; quinta 08-11 com 30 min
  const schedule = [shift(2, '08:00', '12:00', 30), shift(2, '14:00', '18:00', 20), shift(4, '08:00', '11:00', 30)];
  const tuesday = (time: string): Date => new Date(`2026-10-13T${time}:00-03:00`);

  it('encontra o turno de um horario valido, convertendo do UTC para o horario local', () => {
    expect(findShiftForSlot(schedule, new Date('2026-10-13T11:00:00Z'))).toEqual(schedule[0]);
    expect(findShiftForSlot(schedule, tuesday('14:40'))).toEqual(schedule[1]);
  });

  it('recusa horario fora de qualquer turno', () => {
    expect(findShiftForSlot(schedule, tuesday('12:30'))).toBeNull();
    expect(findShiftForSlot(schedule, new Date('2026-10-14T11:00:00Z'))).toBeNull();
  });

  it('recusa horario desalinhado da grade do turno', () => {
    expect(findShiftForSlot(schedule, tuesday('08:20'))).toBeNull();
    expect(findShiftForSlot(schedule, new Date('2026-10-13T11:00:30Z'))).toBeNull();
  });

  it('recusa consulta que nao cabe no fim do turno', () => {
    const odd = [shift(2, '08:00', '09:45', 30)];
    expect(findShiftForSlot(odd, tuesday('09:30'))).toBeNull();
    expect(findShiftForSlot(odd, tuesday('09:00'))).toEqual(odd[0]);
  });
});
