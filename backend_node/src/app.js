import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import productRoutes from './routes/productRoutes.js';
import suggestionRoutes from './routes/suggestionRoutes.js';
import strategyRoutes from './routes/strategyRoutes.js';

const app = express();
app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use('/products', productRoutes);
app.use('/', suggestionRoutes);
app.use('/strategy', strategyRoutes);
app.use((err, _req, res, _next) => {
  const status = err.status || (err.code === 11000 ? 409 : err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 500);
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Internal server error' : err.message });
});

export default app;
