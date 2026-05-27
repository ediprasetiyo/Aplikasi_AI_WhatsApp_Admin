import type { Request, Response, NextFunction } from 'express';

const SECRET = process.env.WORKER_AUTH_SECRET;

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!SECRET) {
    res.status(500).json({ error: 'WORKER_AUTH_SECRET belum di-set di env' });
    return;
  }
  const header = req.headers.authorization ?? '';
  const expected = `Bearer ${SECRET}`;
  if (header !== expected) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  next();
}
