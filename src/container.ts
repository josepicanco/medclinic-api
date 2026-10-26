import { RequestHandler } from 'express';
import { DataSource } from 'typeorm';

import { AppEnv } from './config/env';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { authenticate } from './middlewares/authentication.middleware';
import { UserRepository } from './repositories/user.repository';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { JwtUtil } from './utils/jwt.util';
import { PasswordUtil } from './utils/password.util';

export interface AppContainer {
  readonly authenticate: RequestHandler;
  readonly authController: AuthController;
  readonly userController: UserController;
}

// unico lugar que conhece as implementacoes concretas: o resto recebe tudo pelo construtor (RP02)
export function buildContainer(dataSource: DataSource, env: AppEnv): AppContainer {
  const passwordUtil = new PasswordUtil(env.bcryptSaltRounds);
  const jwtUtil = new JwtUtil(env.jwt.secret, env.jwt.expiresIn);

  const userRepository = new UserRepository(dataSource);

  const authService = new AuthService(userRepository, passwordUtil, jwtUtil);
  const userService = new UserService(userRepository);

  return {
    authenticate: authenticate(jwtUtil),
    authController: new AuthController(authService),
    userController: new UserController(userService),
  };
}
