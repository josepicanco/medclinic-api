import { describe, expect, it } from 'vitest';

import { AppointmentStatus } from '../../../src/enums/appointment-status.enum';
import { UserRole } from '../../../src/enums/user-role.enum';
import { canPerformTransition, transitionAuthorities } from '../../../src/rules/appointment-status.rules';

const { SCHEDULED, IN_PROGRESS, DONE, CANCELLED } = AppointmentStatus;

describe('ciclo de vida da consulta (RN11/RN12)', () => {
  it('lista as transicoes permitidas com suas autoridades', () => {
    expect(transitionAuthorities(SCHEDULED, IN_PROGRESS)).toEqual(['admin', 'owner_doctor']);
    expect(transitionAuthorities(SCHEDULED, CANCELLED)).toEqual(['admin', 'secretary', 'owner_doctor']);
    expect(transitionAuthorities(IN_PROGRESS, DONE)).toEqual(['admin', 'owner_doctor']);
    expect(transitionAuthorities(IN_PROGRESS, CANCELLED)).toEqual(['admin', 'owner_doctor']);
  });

  it('nao permite sair de estado final nem pular etapa', () => {
    expect(transitionAuthorities(DONE, CANCELLED)).toBeNull();
    expect(transitionAuthorities(CANCELLED, SCHEDULED)).toBeNull();
    expect(transitionAuthorities(SCHEDULED, DONE)).toBeNull();
    expect(transitionAuthorities(SCHEDULED, SCHEDULED)).toBeNull();
  });

  it('confere a autoridade de cada perfil', () => {
    const start = transitionAuthorities(SCHEDULED, IN_PROGRESS) ?? [];
    const cancelScheduled = transitionAuthorities(SCHEDULED, CANCELLED) ?? [];

    expect(canPerformTransition(start, [UserRole.ADMIN], false)).toBe(true);
    expect(canPerformTransition(start, [UserRole.DOCTOR], true)).toBe(true);
    expect(canPerformTransition(start, [UserRole.DOCTOR], false)).toBe(false);
    expect(canPerformTransition(start, [UserRole.SECRETARY], false)).toBe(false);
    expect(canPerformTransition(cancelScheduled, [UserRole.SECRETARY], false)).toBe(true);
  });
});
