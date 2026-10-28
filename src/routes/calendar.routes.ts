import { RequestHandler, Router } from 'express';

import { CalendarController } from '../controllers/calendar.controller';
import { calendarQuerySchema } from '../dtos/calendar.dto';
import { doctorIdParamSchema } from '../dtos/common.dto';
import { validate } from '../middlewares/validation.middleware';

// montado em /doctors
export function createCalendarRoutes(calendarController: CalendarController, authenticate: RequestHandler): Router {
  const calendarRoutes = Router();

  calendarRoutes.get(
    '/:doctorId/calendar',
    authenticate,
    validate({ params: doctorIdParamSchema, query: calendarQuerySchema }),
    calendarController.findByDoctorId,
  );

  return calendarRoutes;
}
