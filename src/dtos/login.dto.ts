import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1).max(180).toLowerCase(),
  password: z.string().min(1).max(200),
});

export type LoginDTO = z.infer<typeof loginSchema>;
