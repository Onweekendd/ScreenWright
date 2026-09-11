import { Router, Request, Response } from 'express';
import { energyConsumption } from '../data/mock-data';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Energy
 *   description: 能耗监控数据
 */

/**
 * @swagger
 * /api/energy:
 *   get:
 *     summary: 获取能耗总览
 *     description: 返回今日/本月电耗、费用、单件能耗及分时用电，用于大屏能耗看板
 *     tags: [Energy]
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
 *                     todayKwh:
 *                       type: number
 *                       description: 今日用电量（度）
 *                     monthKwh:
 *                       type: number
 *                       description: 本月用电量（度）
 *                     costToday:
 *                       type: number
 *                       description: 今日电费（元）
 *                     costMonth:
 *                       type: number
 *                       description: 本月电费（元）
 *                     perUnitKwh:
 *                       type: number
 *                       description: 单件能耗（度/件）
 *                     hourly:
 *                       type: array
 *                       description: 分时用电量
 *                       items:
 *                         type: object
 *                         properties:
 *                           hour:
 *                             type: string
 *                           kwh:
 *                             type: number
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({ code: 0, data: energyConsumption });
});

export default router;
