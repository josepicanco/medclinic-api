import { RequestHandler, Router } from 'express';

import { MedicalRecordController } from '../controllers/medical-record.controller';
import { paginationQuerySchema, patientIdParamSchema } from '../dtos/common.dto';
import { createMedicalRecordSchema } from '../dtos/medical-record.dto';
import { UserRole } from '../enums/user-role.enum';
import { authorize } from '../middlewares/authorization.middleware';
import { validate } from '../middlewares/validation.middleware';

// montado em /patients. o perfil e conferido aqui; o vinculo com o paciente, no service
export function createMedicalRecordRoutes(
  medicalRecordController: MedicalRecordController,
  authenticate: RequestHandler,
): Router {
  const medicalRecordRoutes = Router();

  medicalRecordRoutes.post(
    '/:patientId/medical-records',
    authenticate,
    authorize(UserRole.DOCTOR),
    validate({ params: patientIdParamSchema, body: createMedicalRecordSchema }),
    medicalRecordController.create,
  );
  medicalRecordRoutes.get(
    '/:patientId/medical-records',
    authenticate,
    authorize(UserRole.DOCTOR, UserRole.ADMIN),
    validate({ params: patientIdParamSchema, query: paginationQuerySchema }),
    medicalRecordController.list,
  );

  return medicalRecordRoutes;
}
