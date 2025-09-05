import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';

import jobsRouter from './routes/jobs';
import candidatesRouter from './routes/candidates';
import applicationsRouter from './routes/applications';
import analyticsRouter from './routes/analytics';
import authRouter from './routes/auth';
import { errorHandler } from './middleware/errorHandler';

config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/candidates', candidatesRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/analytics', analyticsRouter);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`TalentFlow API running on port ${PORT}`);
});

export default app;
