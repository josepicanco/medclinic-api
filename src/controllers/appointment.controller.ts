import { Request, Response } from 'express';

import { createAppointmentSchema, listAppointmentsQuerySchema } from '../dtos/appointment.dto';
import { idParamSchema } from '../dtos/common.dto';
import { getAuthenticatedUser } from '../middlewares/authentication.middleware';
import { getValidated } from '../middlewares/validation.middleware';
import { AppointmentService } from '../services/appointment.service';

export class AppointmentController {
  private readonly appointmentService: AppointmentService;

  constructor(appointmentService: AppointmentService) {
    this.appointmentService = appointmentService;
  }

  public create = async (_request: Request, response: Response): Promise<void> => {
    const dto = getValidated(response, 'body', createAppointmentSchema);
    response.status(201).json(await this.appointmentService.create(dto));
  };

  public list = async (request: Request, response: Response): Promise<void> => {
    const query = getValidated(response, 'query', listAppointmentsQuerySchema);
    response.status(200).json(await this.appointmentService.list(getAuthenticatedUser(request), query));
  };

  public findById = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidated(response, 'params', idParamSchema);
    response.status(200).json(await this.appointmentService.findById(getAuthenticatedUser(request), id));
  };
}
