import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import casesRouter from './routes/cases.js';
import { notFoundHandler, errorHandler } from './middleware/errors.js';
import { config } from './config.js';

const app = express();

app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/cases', casesRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
