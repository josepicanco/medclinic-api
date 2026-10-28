import { Request, Response } from 'express';

import { calendarQuerySchema } from '../dtos/calendar.dto';
import { doctorIdParamSchema } from '../dtos/common.dto';
import { getValidated } from '../middlewares/validation.middleware';
import { CalendarService } from '../services/calendar.service';

export class CalendarController {
  private readonly calendarService: CalendarService;

  constructor(calendarService: CalendarService) {
    this.calendarService = calendarService;
  }

  public findByDoctorId = async (_request: Request, response: Response): Promise<void> => {
    const { doctorId } = getValidated(response, 'params', doctorIdParamSchema);
    const query = getValidated(response, 'query', calendarQuerySchema);
    response.status(200).json(await this.calendarService.findByDoctorId(doctorId, query));
  };
}
