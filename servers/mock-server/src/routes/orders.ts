import { Router, Request, Response } from 'express';
import { orders } from '../data/mock-data';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: 生产订单管理
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: 获取生产订单列表
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [running, pending, done]
 *         description: 按状态过滤
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [urgent, high, normal]
 *         description: 按优先级过滤
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
 *                         example: PO-2024051401
 *                       customer:
 *                         type: string
 *                       product:
 *                         type: string
 *                       quantity:
 *                         type: integer
 *                         description: 计划数量
 *                       completed:
 *                         type: integer
 *                         description: 已完成数量
 *                       status:
 *                         type: string
 *                         enum: [running, pending, done]
 *                       deadline:
 *                         type: string
 *                         description: 交期
 *                       priority:
 *                         type: string
 *                         enum: [urgent, high, normal]
 */
router.get('/', (req: Request, res: Response) => {
  const { status, priority } = req.query;
  let result = [...orders];

  if (status) result = result.filter((o) => o.status === status);
  if (priority) result = result.filter((o) => o.priority === priority);

  res.json({ code: 0, data: result });
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: 获取订单详情
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: PO-2024051401
 *     responses:
 *       200:
 *         description: 成功
 *       404:
 *         description: 订单不存在
 */
router.get('/:id', (req: Request, res: Response) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ code: 404, message: '订单不存在' });
    return;
  }
  res.json({ code: 0, data: order });
});

export default router;
