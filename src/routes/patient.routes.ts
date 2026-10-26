import { RequestHandler, Router } from 'express';

import { PatientController } from '../controllers/patient.controller';
import { idParamSchema } from '../dtos/common.dto';
import { createPatientSchema, listPatientsQuerySchema, updatePatientSchema } from '../dtos/patient.dto';
import { UserRole } from '../enums/user-role.enum';
import { authorize } from '../middlewares/authorization.middleware';
import { validate } from '../middlewares/validation.middleware';

export function createPatientRoutes(patientController: PatientController, authenticate: RequestHandler): Router {
  const patientRoutes = Router();

  patientRoutes.post(
    '/',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SECRETARY),
    validate({ body: createPatientSchema }),
    patientController.create,
  );
  patientRoutes.get('/', authenticate, validate({ query: listPatientsQuerySchema }), patientController.list);
  patientRoutes.get('/:id', authenticate, validate({ params: idParamSchema }), patientController.findById);
  patientRoutes.patch(
    '/:id',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SECRETARY),
    validate({ params: idParamSchema, body: updatePatientSchema }),
    patientController.update,
  );
  patientRoutes.delete(
    '/:id',
    authenticate,
    authorize(UserRole.ADMIN),
    validate({ params: idParamSchema }),
    patientController.remove,
  );

  return patientRoutes;
}
