import { Router, Request, Response } from 'express';
import { productionLines, hourlyOutput, dailyOutput } from '../data/mock-data';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Production
 *   description: 生产线与产量数据
 */

/**
 * @swagger
 * /api/production/lines:
 *   get:
 *     summary: 获取所有生产线实时状态
 *     tags: [Production]
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 0
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: L01
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [running, warning, idle, fault]
 *                       efficiency:
 *                         type: number
 *                         description: 效率（%）
 *                       output:
 *                         type: integer
 *                         description: 当日已产（件）
 *                       target:
 *                         type: integer
 *                         description: 当日目标（件）
 *                       defectRate:
 *                         type: number
 *                         description: 不良率（%）
 */
router.get('/lines', (_req: Request, res: Response) => {
  res.json({ code: 0, data: productionLines });
});

/**
 * @swagger
 * /api/production/lines/{id}:
 *   get:
 *     summary: 获取单条生产线详情
 *     tags: [Production]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: L01
 *     responses:
 *       200:
 *         description: 成功
 *       404:
 *         description: 生产线不存在
 */
router.get('/lines/:id', (req: Request, res: Response) => {
  const line = productionLines.find((l) => l.id === req.params.id);
  if (!line) {
    res.status(404).json({ code: 404, message: '生产线不存在' });
    return;
  }
  res.json({ code: 0, data: line });
});

/**
 * @swagger
 * /api/production/hourly:
 *   get:
 *     summary: 获取今日分时产量
 *     description: 返回当班每小时的实际产量、目标产量与缺陷数，用于折线图展示
 *     tags: [Production]
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       hour:
 *                         type: string
 *                         example: "08:00"
 *                       actual:
 *                         type: integer
 *                       target:
 *                         type: integer
 *                       defects:
 *                         type: integer
 */
router.get('/hourly', (_req: Request, res: Response) => {
  res.json({ code: 0, data: hourlyOutput });
});

/**
 * @swagger
 * /api/production/daily:
 *   get:
 *     summary: 获取近30天日产量趋势
 *     description: 用于大屏趋势折线图，周末产量为0
 *     tags: [Production]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: 查询天数（最多30天）
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         example: "05-14"
 *                       output:
 *                         type: integer
 *                       target:
 *                         type: integer
 */
router.get('/daily', (req: Request, res: Response) => {
  const days = Math.min(Number(req.query.days) || 30, 30);
  res.json({ code: 0, data: dailyOutput.slice(-days) });
});

export default router;
