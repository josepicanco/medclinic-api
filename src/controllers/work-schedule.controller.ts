import { Request, Response } from 'express';

import { doctorIdParamSchema } from '../dtos/common.dto';
import { workScheduleSchema } from '../dtos/work-schedule.dto';
import { getValidated } from '../middlewares/validation.middleware';
import { WorkScheduleService } from '../services/work-schedule.service';

export class WorkScheduleController {
  private readonly workScheduleService: WorkScheduleService;

  constructor(workScheduleService: WorkScheduleService) {
    this.workScheduleService = workScheduleService;
  }

  public replace = async (_request: Request, response: Response): Promise<void> => {
    const { doctorId } = getValidated(response, 'params', doctorIdParamSchema);
    const dto = getValidated(response, 'body', workScheduleSchema);
    response.status(200).json(await this.workScheduleService.replace(doctorId, dto));
  };

  public findByDoctorId = async (_request: Request, response: Response): Promise<void> => {
    const { doctorId } = getValidated(response, 'params', doctorIdParamSchema);
    response.status(200).json(await this.workScheduleService.findByDoctorId(doctorId));
  };
}
