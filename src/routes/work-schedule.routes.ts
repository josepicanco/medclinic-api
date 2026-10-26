import { RequestHandler, Router } from 'express';

import { WorkScheduleController } from '../controllers/work-schedule.controller';
import { doctorIdParamSchema } from '../dtos/common.dto';
import { workScheduleSchema } from '../dtos/work-schedule.dto';
import { UserRole } from '../enums/user-role.enum';
import { authorize } from '../middlewares/authorization.middleware';
import { validate } from '../middlewares/validation.middleware';

// montado em /doctors
export function createWorkScheduleRoutes(
  workScheduleController: WorkScheduleController,
  authenticate: RequestHandler,
): Router {
  const workScheduleRoutes = Router();

  workScheduleRoutes.put(
    '/:doctorId/work-schedule',
    authenticate,
    authorize(UserRole.ADMIN),
    validate({ params: doctorIdParamSchema, body: workScheduleSchema }),
    workScheduleController.replace,
  );
  workScheduleRoutes.get(
    '/:doctorId/work-schedule',
    authenticate,
    validate({ params: doctorIdParamSchema }),
    workScheduleController.findByDoctorId,
  );

  return workScheduleRoutes;
}
