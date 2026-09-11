import { Router, Request, Response } from 'express';
import { defectTypes } from '../data/mock-data';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Quality
 *   description: 质检与不良分析
 */

/**
 * @swagger
 * /api/quality/defects:
 *   get:
 *     summary: 获取缺陷类型分布
 *     description: 返回各缺陷类型的数量、不良率和趋势，用于大屏饼图或排行榜
 *     tags: [Quality]
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
 *                       type:
 *                         type: string
 *                         description: 缺陷类型名称
 *                       count:
 *                         type: integer
 *                         description: 当日发生数量
 *                       rate:
 *                         type: number
 *                         description: 占总产量不良率（%）
 *                       trend:
 *                         type: string
 *                         enum: [up, down, stable]
 *                         description: 与昨日对比趋势
 */
router.get('/defects', (_req: Request, res: Response) => {
  res.json({ code: 0, data: defectTypes });
});

/**
 * @swagger
 * /api/quality/summary:
 *   get:
 *     summary: 获取质检汇总指标（用于大屏统计卡片）
 *     tags: [Quality]
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
 *                     totalInspected:
 *                       type: integer
 *                       description: 今日检测总数
 *                     totalDefects:
 *                       type: integer
 *                       description: 今日总缺陷数
 *                     defectRate:
 *                       type: number
 *                       description: 综合不良率（%）
 *                     passRate:
 *                       type: number
 *                       description: 直通率（%）
 *                     topDefect:
 *                       type: string
 *                       description: 最多缺陷类型
 */
router.get('/summary', (_req: Request, res: Response) => {
  const totalDefects = defectTypes.reduce((sum, d) => sum + d.count, 0);
  const totalInspected = 16480;
  const topDefect = defectTypes.reduce((a, b) => (a.count > b.count ? a : b));

  res.json({
    code: 0,
    data: {
      totalInspected,
      totalDefects,
      defectRate: Number(((totalDefects / totalInspected) * 100).toFixed(2)),
      passRate: Number((((totalInspected - totalDefects) / totalInspected) * 100).toFixed(2)),
      topDefect: topDefect.type,
    },
  });
});

export default router;
