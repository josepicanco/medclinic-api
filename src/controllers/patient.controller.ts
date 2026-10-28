import { Request, Response } from 'express';

import { idParamSchema } from '../dtos/common.dto';
import { createPatientSchema, listPatientsQuerySchema, updatePatientSchema } from '../dtos/patient.dto';
import { getValidated } from '../middlewares/validation.middleware';
import { PatientService } from '../services/patient.service';

export class PatientController {
  private readonly patientService: PatientService;

  constructor(patientService: PatientService) {
    this.patientService = patientService;
  }

  public create = async (_request: Request, response: Response): Promise<void> => {
    const dto = getValidated(response, 'body', createPatientSchema);
    response.status(201).json(await this.patientService.create(dto));
  };

  public list = async (_request: Request, response: Response): Promise<void> => {
    const query = getValidated(response, 'query', listPatientsQuerySchema);
    response.status(200).json(await this.patientService.list(query));
  };

  public findById = async (_request: Request, response: Response): Promise<void> => {
    const { id } = getValidated(response, 'params', idParamSchema);
    response.status(200).json(await this.patientService.findById(id));
  };

  public update = async (_request: Request, response: Response): Promise<void> => {
    const { id } = getValidated(response, 'params', idParamSchema);
    const dto = getValidated(response, 'body', updatePatientSchema);
    response.status(200).json(await this.patientService.update(id, dto));
  };

  public remove = async (_request: Request, response: Response): Promise<void> => {
    const { id } = getValidated(response, 'params', idParamSchema);
    await this.patientService.remove(id);
    response.status(204).end();
  };
}
