import { Router, Request, Response } from 'express';
import { equipment } from '../data/mock-data';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Equipment
 *   description: 设备状态管理
 */

/**
 * @swagger
 * /api/equipment:
 *   get:
 *     summary: 获取设备列表
 *     tags: [Equipment]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [running, warning, fault, idle]
 *         description: 按状态过滤
 *       - in: query
 *         name: line
 *         schema:
 *           type: string
 *         description: 按生产线过滤，如 L01
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
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       line:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [running, warning, fault, idle]
 *                       uptime:
 *                         type: number
 *                         description: 稼动率（%）
 *                       lastMaintenance:
 *                         type: string
 *                       nextMaintenance:
 *                         type: string
 *                       temperature:
 *                         type: number
 *                         description: 当前温度（°C）
 */
router.get('/', (req: Request, res: Response) => {
  const { status, line } = req.query;
  let result = [...equipment];

  if (status) result = result.filter((e) => e.status === status);
  if (line) result = result.filter((e) => e.line === line);

  res.json({ code: 0, data: result });
});

/**
 * @swagger
 * /api/equipment/{id}:
 *   get:
 *     summary: 获取单台设备详情
 *     tags: [Equipment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: EQ001
 *     responses:
 *       200:
 *         description: 成功
 *       404:
 *         description: 设备不存在
 */
router.get('/:id', (req: Request, res: Response) => {
  const eq = equipment.find((e) => e.id === req.params.id);
  if (!eq) {
    res.status(404).json({ code: 404, message: '设备不存在' });
    return;
  }
  res.json({ code: 0, data: eq });
});

/**
 * @swagger
 * /api/equipment/stats/summary:
 *   get:
 *     summary: 获取设备状态汇总（用于大屏饼图/统计卡片）
 *     tags: [Equipment]
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
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     running:
 *                       type: integer
 *                     warning:
 *                       type: integer
 *                     fault:
 *                       type: integer
 *                     idle:
 *                       type: integer
 *                     avgUptime:
 *                       type: number
 *                       description: 平均稼动率（%）
 */
router.get('/stats/summary', (_req: Request, res: Response) => {
  const summary = {
    total: equipment.length,
    running: equipment.filter((e) => e.status === 'running').length,
    warning: equipment.filter((e) => e.status === 'warning').length,
    fault: equipment.filter((e) => e.status === 'fault').length,
    idle: equipment.filter((e) => e.status === 'idle').length,
    avgUptime: Number(
      (equipment.reduce((sum, e) => sum + e.uptime, 0) / equipment.length).toFixed(1)
    ),
  };
  res.json({ code: 0, data: summary });
});

export default router;
