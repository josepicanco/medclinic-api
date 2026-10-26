import { toClinicLocalTime } from './clinic-time.rules';

export interface ShiftTime {
  readonly weekDay: number;
  readonly startMinutes: number;
  readonly endMinutes: number;
  readonly slotDurationMinutes: number;
}

// RN05: so conflita no mesmo dia da semana; turnos encostados sao validos
export function shiftsOverlap(a: ShiftTime, b: ShiftTime): boolean {
  return a.weekDay === b.weekDay && a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

export function hasOverlappingShifts(shifts: readonly ShiftTime[]): boolean {
  const sorted = [...shifts].sort((a, b) => a.weekDay - b.weekDay || a.startMinutes - b.startMinutes);

  for (let index = 1; index < sorted.length; index++) {
    if (shiftsOverlap(sorted[index - 1], sorted[index])) {
      return true;
    }
  }

  return false;
}

export function isShiftWellFormed(shift: ShiftTime): boolean {
  return (
    Number.isInteger(shift.weekDay) &&
    shift.weekDay >= 0 &&
    shift.weekDay <= 6 &&
    shift.startMinutes < shift.endMinutes &&
    Number.isInteger(shift.slotDurationMinutes) &&
    shift.slotDurationMinutes > 0
  );
}

// RN07: o horario precisa cair num turno do dia, estar alinhado a grade e caber inteiro no turno.
// devolve o turno que comporta o horario ou null quando o horario nao existe na agenda
export function findShiftForSlot<T extends ShiftTime>(shifts: readonly T[], startsAt: Date): T | null {
  if (startsAt.getUTCSeconds() !== 0 || startsAt.getUTCMilliseconds() !== 0) {
    return null;
  }

  const local = toClinicLocalTime(startsAt);
  const shift = shifts.find(
    (item) =>
      item.weekDay === local.weekDay && local.minutesOfDay >= item.startMinutes && local.minutesOfDay < item.endMinutes,
  );

  if (!shift) {
    return null;
  }

  const alignedToGrid = (local.minutesOfDay - shift.startMinutes) % shift.slotDurationMinutes === 0;
  const fitsInShift = local.minutesOfDay + shift.slotDurationMinutes <= shift.endMinutes;

  return alignedToGrid && fitsInShift ? shift : null;
}
