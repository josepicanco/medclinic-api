import { Request, Response, Router } from 'express';

import { AppContainer } from '../container';
import { createAppointmentRoutes } from './appointment.routes';
import { createAuthRoutes } from './auth.routes';
import { createCalendarRoutes } from './calendar.routes';
import { createDoctorRoutes } from './doctor.routes';
import { createPatientRoutes } from './patient.routes';
import { createUserRoutes } from './user.routes';
import { createWorkScheduleRoutes } from './work-schedule.routes';

export function createRoutes(container: AppContainer): Router {
  const routes = Router();
  const { authenticate } = container;

  routes.get('/health', (_request: Request, response: Response) => {
    response.status(200).json({ status: 'ok' });
  });

  routes.use('/auth', createAuthRoutes(container.authController));
  routes.use('/users', createUserRoutes(container.userController, authenticate));
  routes.use('/patients', createPatientRoutes(container.patientController, authenticate));
  routes.use('/doctors', createDoctorRoutes(container.doctorController, authenticate));
  routes.use('/doctors', createWorkScheduleRoutes(container.workScheduleController, authenticate));
  routes.use('/doctors', createCalendarRoutes(container.calendarController, authenticate));
  routes.use('/appointments', createAppointmentRoutes(container.appointmentController, authenticate));

  return routes;
}
