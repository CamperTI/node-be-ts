import cors from 'cors';
import express, { Request, Response } from 'express';
import newsRoutes from './routes/newsRoute';
import dividendsRoutes from './routes/dividendsRoute';
import { resHandler } from './middlewares/resHandler';
import stocksRoute from './routes/stocksRoute';
import courseRoute from './routes/courseRoute';
// import redis from './config/redis';
import ticketsRoute from './routes/ticketsRoute';

const app = express();

app.use(cors({ origin: 'http://localhost:3001' })); // Allow your frontend origin

app.use(express.json());

app.use(resHandler);

// Routes
app.use('/api/v1', newsRoutes);
app.use('/api/v1', dividendsRoutes);
app.use('/api/v1', stocksRoute);
app.use('/api/v1', courseRoute);
app.use('/api/v1', ticketsRoute);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript + Node.js + Express!');
});

// app.get('/hello-cache', async (req, res) => {
//   await redis.set('hello', 'world');
//   const value = await redis.get('hello');
//   res.send({ value });
// });

// Global error handler (should be after routes)
// app.use(errorHandler);

export default app;
