import { RequestHandler, Router } from 'express';

import { AppointmentController } from '../controllers/appointment.controller';
import { changeStatusSchema, createAppointmentSchema, listAppointmentsQuerySchema } from '../dtos/appointment.dto';
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
  // a autoridade depende da transicao (RN12), entao quem decide e o service
  appointmentRoutes.patch(
    '/:id/status',
    authenticate,
    validate({ params: idParamSchema, body: changeStatusSchema }),
    appointmentController.changeStatus,
  );

  return appointmentRoutes;
}
