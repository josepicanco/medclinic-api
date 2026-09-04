import express, { Request, Response } from 'express';

const app = express();
const PORT = 3333;

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`[server] MedClinic API rodando em http://localhost:${PORT}`);
});
