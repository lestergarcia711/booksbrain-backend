import express from 'express';
import { categoryController } from './container.js';
import createApiRouter from './routes/index.js';
import { notFoundHandler} from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

const app = express();

app.use(express.json({ limit: '10kb' }));

app.get('/api/v1/health', (req, res) => {
   res.json({ status: 'success', message: 'API funcionando' });
});

app.use('/api/v1', createApiRouter({ categoryController }));
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
 
