import { Router, Request, Response } from 'express';
import { overview } from '../data/mock-data';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Overview
 *   description: 工厂大屏总览
 */

/**
 * @swagger
 * /api/overview:
 *   get:
 *     summary: 获取工厂看板总览数据
 *     description: 包含今日产量、综合效率、不良率、在线设备数、预警信息等核心指标
 *     tags: [Overview]
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
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       example: "2024-05-14"
 *                     shift:
 *                       type: string
 *                       example: "白班 08:00-20:00"
 *                     totalOutput:
 *                       type: integer
 *                       description: 今日实际产量（件）
 *                     totalTarget:
 *                       type: integer
 *                       description: 今日目标产量（件）
 *                     completionRate:
 *                       type: number
 *                       description: 完成率（%）
 *                     overallEfficiency:
 *                       type: number
 *                       description: 综合效率 OEE（%）
 *                     defectRate:
 *                       type: number
 *                       description: 综合不良率（%）
 *                     onlineEquipment:
 *                       type: integer
 *                     totalEquipment:
 *                       type: integer
 *                     alerts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           level:
 *                             type: string
 *                             enum: [error, warning, info]
 *                           message:
 *                             type: string
 *                           time:
 *                             type: string
 *                           line:
 *                             type: string
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({ code: 0, data: overview });
});

export default router;
