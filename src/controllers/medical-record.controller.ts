import { Request, Response } from 'express';

import { paginationQuerySchema, patientIdParamSchema } from '../dtos/common.dto';
import { createMedicalRecordSchema } from '../dtos/medical-record.dto';
import { getAuthenticatedUser } from '../middlewares/authentication.middleware';
import { getValidated } from '../middlewares/validation.middleware';
import { MedicalRecordService } from '../services/medical-record.service';

export class MedicalRecordController {
  private readonly medicalRecordService: MedicalRecordService;

  constructor(medicalRecordService: MedicalRecordService) {
    this.medicalRecordService = medicalRecordService;
  }

  public create = async (request: Request, response: Response): Promise<void> => {
    const { patientId } = getValidated(response, 'params', patientIdParamSchema);
    const dto = getValidated(response, 'body', createMedicalRecordSchema);
    response.status(201).json(await this.medicalRecordService.create(getAuthenticatedUser(request), patientId, dto));
  };

  public list = async (request: Request, response: Response): Promise<void> => {
    const { patientId } = getValidated(response, 'params', patientIdParamSchema);
    const query = getValidated(response, 'query', paginationQuerySchema);
    response.status(200).json(await this.medicalRecordService.list(getAuthenticatedUser(request), patientId, query));
  };
}
