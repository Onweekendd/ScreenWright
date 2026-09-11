import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import overviewRouter from './routes/overview';
import productionRouter from './routes/production';
import equipmentRouter from './routes/equipment';
import qualityRouter from './routes/quality';
import ordersRouter from './routes/orders';
import energyRouter from './routes/energy';

const app = express();
const PORT = 3100;

app.use(express.json());

app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Swagger 文档
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: '电子厂大屏 Mock API 文档',
}));

// 返回原始 swagger.json
app.get('/docs-json', (_, res) => {
  res.json(swaggerSpec);
});

// 业务路由
app.use('/api/overview', overviewRouter);
app.use('/api/production', productionRouter);
app.use('/api/equipment', equipmentRouter);
app.use('/api/quality', qualityRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/energy', energyRouter);

app.get('/', (_, res) => {
  res.json({
    message: '电子厂大屏 Mock Server',
    docs: `http://localhost:${PORT}/docs`,
    endpoints: [
      'GET /api/overview',
      'GET /api/production/lines',
      'GET /api/production/lines/:id',
      'GET /api/production/hourly',
      'GET /api/production/daily',
      'GET /api/equipment',
      'GET /api/equipment/:id',
      'GET /api/equipment/stats/summary',
      'GET /api/quality/defects',
      'GET /api/quality/summary',
      'GET /api/orders',
      'GET /api/orders/:id',
      'GET /api/energy',
    ],
  });
});

app.listen(PORT, () => {
  console.log(`Mock Server running at http://localhost:${PORT}`);
  console.log(`Swagger Docs   at http://localhost:${PORT}/docs`);
});
