import { AppointmentStatus } from '../enums/appointment-status.enum';
import { UserRole } from '../enums/user-role.enum';

// quem pode executar a transicao; owner_doctor e o medico da propria consulta
export type TransitionAuthority = 'admin' | 'secretary' | 'owner_doctor';

interface Transition {
  readonly from: AppointmentStatus;
  readonly to: AppointmentStatus;
  readonly authorities: readonly TransitionAuthority[];
}

// RN11/RN12 (tabela da secao 4.9.7). done e cancelled sao estados finais
const TRANSITIONS: readonly Transition[] = [
  { from: AppointmentStatus.SCHEDULED, to: AppointmentStatus.IN_PROGRESS, authorities: ['admin', 'owner_doctor'] },
  {
    from: AppointmentStatus.SCHEDULED,
    to: AppointmentStatus.CANCELLED,
    authorities: ['admin', 'secretary', 'owner_doctor'],
  },
  { from: AppointmentStatus.IN_PROGRESS, to: AppointmentStatus.DONE, authorities: ['admin', 'owner_doctor'] },
  { from: AppointmentStatus.IN_PROGRESS, to: AppointmentStatus.CANCELLED, authorities: ['admin', 'owner_doctor'] },
];

// null quando o ciclo de vida nao permite a mudanca
export function transitionAuthorities(
  from: AppointmentStatus,
  to: AppointmentStatus,
): readonly TransitionAuthority[] | null {
  const transition = TRANSITIONS.find((item) => item.from === from && item.to === to);
  return transition ? transition.authorities : null;
}

export function canPerformTransition(
  authorities: readonly TransitionAuthority[],
  roles: readonly UserRole[],
  isAppointmentDoctor: boolean,
): boolean {
  if (authorities.includes('admin') && roles.includes(UserRole.ADMIN)) {
    return true;
  }

  if (authorities.includes('secretary') && roles.includes(UserRole.SECRETARY)) {
    return true;
  }

  return authorities.includes('owner_doctor') && roles.includes(UserRole.DOCTOR) && isAppointmentDoctor;
}
