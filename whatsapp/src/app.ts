import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import messagesRouter from './routes/messages';
import healthRouter from './routes/health';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '16kb' }));

app.set('trust proxy', 1);

app.use('/health', healthRouter);

app.use('/api/v1', messagesRouter);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
