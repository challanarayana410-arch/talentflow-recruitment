import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  // Multer file size error
  if (err.message === 'File too large') {
    return res.status(400).json({
      success: false,
      error: 'File size exceeds the 5MB limit',
    });
  }

  // Multer file type error
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      error: 'Database operation failed',
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
}
