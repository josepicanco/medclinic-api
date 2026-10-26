export interface Period {
  readonly startsAt: Date;
  readonly endsAt: Date;
}

// RN08/RN09: conflito e intersecao estrita, entao periodos encostados convivem
export function periodsOverlap(a: Period, b: Period): boolean {
  return a.startsAt.getTime() < b.endsAt.getTime() && b.startsAt.getTime() < a.endsAt.getTime();
}

export function addMinutes(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * 60_000);
}
