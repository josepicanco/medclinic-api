import { RequestHandler, Router } from 'express';

import { AppointmentController } from '../controllers/appointment.controller';
import { createAppointmentSchema, listAppointmentsQuerySchema } from '../dtos/appointment.dto';
import { idParamSchema } from '../dtos/common.dto';
import { UserRole } from '../enums/user-role.enum';
import { authorize } from '../middlewares/authorization.middleware';
import { validate } from '../middlewares/validation.middleware';

export function createAppointmentRoutes(
  appointmentController: AppointmentController,
  authenticate: RequestHandler,
): Router {
  const appointmentRoutes = Router();

  appointmentRoutes.post(
    '/',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SECRETARY),
    validate({ body: createAppointmentSchema }),
    appointmentController.create,
  );
  // o filtro por posse do medico fica no service (RF10)
  appointmentRoutes.get(
    '/',
    authenticate,
    validate({ query: listAppointmentsQuerySchema }),
    appointmentController.list,
  );
  appointmentRoutes.get('/:id', authenticate, validate({ params: idParamSchema }), appointmentController.findById);

  return appointmentRoutes;
}
