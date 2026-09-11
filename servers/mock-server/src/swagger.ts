import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '电子厂大屏 Mock API',
      version: '1.0.0',
      description: '为电子厂大屏展示提供模拟数据接口，涵盖生产、设备、质检、订单、能耗五大模块',
      contact: {
        name: 'Screenwright Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3100',
        description: '本地开发服务器',
      },
    ],
    components: {
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            code: { type: 'integer', example: 0 },
            message: { type: 'string', example: 'success' },
            data: { type: 'object' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
