import { Request, Response } from 'express';

import { idParamSchema } from '../dtos/common.dto';
import { createDoctorSchema, listDoctorsQuerySchema } from '../dtos/doctor.dto';
import { getValidated } from '../middlewares/validation.middleware';
import { DoctorService } from '../services/doctor.service';

export class DoctorController {
  private readonly doctorService: DoctorService;

  constructor(doctorService: DoctorService) {
    this.doctorService = doctorService;
  }

  public create = async (_request: Request, response: Response): Promise<void> => {
    const dto = getValidated(response, 'body', createDoctorSchema);
    response.status(201).json(await this.doctorService.create(dto));
  };

  public list = async (_request: Request, response: Response): Promise<void> => {
    const query = getValidated(response, 'query', listDoctorsQuerySchema);
    response.status(200).json(await this.doctorService.list(query));
  };

  public findById = async (_request: Request, response: Response): Promise<void> => {
    const { id } = getValidated(response, 'params', idParamSchema);
    response.status(200).json(await this.doctorService.findById(id));
  };
}
