import { RequestHandler, Router } from 'express';

import { DoctorController } from '../controllers/doctor.controller';
import { idParamSchema } from '../dtos/common.dto';
import { createDoctorSchema, listDoctorsQuerySchema } from '../dtos/doctor.dto';
import { UserRole } from '../enums/user-role.enum';
import { authorize } from '../middlewares/authorization.middleware';
import { validate } from '../middlewares/validation.middleware';

export function createDoctorRoutes(doctorController: DoctorController, authenticate: RequestHandler): Router {
  const doctorRoutes = Router();

  doctorRoutes.post(
    '/',
    authenticate,
    authorize(UserRole.ADMIN),
    validate({ body: createDoctorSchema }),
    doctorController.create,
  );
  doctorRoutes.get('/', authenticate, validate({ query: listDoctorsQuerySchema }), doctorController.list);
  doctorRoutes.get('/:id', authenticate, validate({ params: idParamSchema }), doctorController.findById);

  return doctorRoutes;
}
