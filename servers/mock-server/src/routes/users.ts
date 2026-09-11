import { Router, Request, Response } from 'express';
import { users } from '../data/mock-data';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 用户管理接口
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 获取用户列表
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, user]
 *         description: 按角色过滤
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功返回用户列表
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
 *                     list:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 */
router.get('/', (req: Request, res: Response) => {
  const { role, page = 1, pageSize = 10 } = req.query;
  let result = [...users];

  if (role) {
    result = result.filter((u) => u.role === role);
  }

  const start = (Number(page) - 1) * Number(pageSize);
  const list = result.slice(start, start + Number(pageSize));

  res.json({
    code: 0,
    data: {
      list,
      total: result.length,
      page: Number(page),
      pageSize: Number(pageSize),
    },
  });
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 根据 ID 获取用户详情
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户 ID
 *     responses:
 *       200:
 *         description: 成功返回用户信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: 用户不存在
 */
router.get('/:id', (req: Request, res: Response) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) {
    res.status(404).json({ code: 404, message: '用户不存在' });
    return;
  }
  res.json({ code: 0, data: user });
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 创建新用户
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: 赵六
 *               email:
 *                 type: string
 *                 example: zhaoliu@example.com
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *                 default: user
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 0
 *                 data:
 *                   $ref: '#/components/schemas/User'
 */
router.post('/', (req: Request, res: Response) => {
  const { name, email, role = 'user' } = req.body;
  const newUser = {
    id: users.length + 1,
    name,
    email,
    role,
    createdAt: new Date().toISOString().split('T')[0],
  };
  users.push(newUser);
  res.status(201).json({ code: 0, data: newUser });
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: 删除用户
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 用户不存在
 */
router.delete('/:id', (req: Request, res: Response) => {
  const index = users.findIndex((u) => u.id === Number(req.params.id));
  if (index === -1) {
    res.status(404).json({ code: 404, message: '用户不存在' });
    return;
  }
  users.splice(index, 1);
  res.json({ code: 0, message: '删除成功' });
});

export default router;
