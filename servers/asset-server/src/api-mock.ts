import express from "express";
import cors from "cors";

// 类型定义
export type DeviceStatus =
  | "online"
  | "offline"
  | "maintenance"
  | "warning"
  | "error";
export type DeviceType =
  | "服务器"
  | "路由器"
  | "交换机"
  | "存储设备"
  | "负载均衡器";
export type Location =
  | "北京机房"
  | "上海机房"
  | "广州机房"
  | "深圳机房"
  | "杭州机房";
export type Department = "研发部" | "运维部" | "测试部" | "产品部" | "市场部";

export interface NetworkInfo {
  upload: number;
  download: number;
  latency: number;
}

export interface DeviceConfig {
  autoRestart: boolean;
  maxConnections: number;
  timeout: number;
}

export interface DeviceMetrics {
  uptime: string;
  requests: number;
  errors: number;
  avgResponseTime: string;
}

export interface Device {
  id: number;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  location: Location;
  department: Department;
  ip: string;
  port: number;
  cpu: number;
  memory: number;
  disk: number;
  network: NetworkInfo;
  tags: string[];
  config: DeviceConfig;
  metrics: DeviceMetrics;
  createdAt: string;
  updatedAt: string;
  description: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

const PORT = 8088;

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);
app.use(express.json());

const mockList: Device[] = Array.from({ length: 50 }, (_, index) => {
  const id = index + 1;
  const statuses = ["online", "offline", "maintenance", "warning", "error"];
  const types = ["服务器", "路由器", "交换机", "存储设备", "负载均衡器"];
  const locations = [
    "北京机房",
    "上海机房",
    "广州机房",
    "深圳机房",
    "杭州机房",
  ];
  const departments = ["研发部", "运维部", "测试部", "产品部", "市场部"];

  return {
    id,
    name: `设备-${String(id).padStart(4, "0")}`,
    type: types[Math.floor(Math.random() * types.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    department: departments[Math.floor(Math.random() * departments.length)],
    ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    port: 8000 + Math.floor(Math.random() * 1000),
    cpu: Math.floor(Math.random() * 100),
    memory: Math.floor(Math.random() * 100),
    disk: Math.floor(Math.random() * 100),
    network: {
      upload: Math.floor(Math.random() * 1000),
      download: Math.floor(Math.random() * 1000),
      latency: Math.floor(Math.random() * 100),
    },
    tags: [
      `标签${Math.floor(Math.random() * 10)}`,
      `标签${Math.floor(Math.random() * 10)}`,
    ],
    config: {
      autoRestart: Math.random() > 0.5,
      maxConnections: 100 + Math.floor(Math.random() * 900),
      timeout: 30 + Math.floor(Math.random() * 120),
    },
    metrics: {
      uptime: Math.floor(Math.random() * 365) + " 天",
      requests: Math.floor(Math.random() * 1000000),
      errors: Math.floor(Math.random() * 1000),
      avgResponseTime: Math.floor(Math.random() * 500) + "ms",
    },
    createdAt: new Date(
      Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
    ).toISOString(),
    updatedAt: new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
    description: `这是${id}号设备的详细描述信息，包含了设备的各项配置参数和运行状态数据。`,
  };
});

app.get("/api/mock/list", (_req, res) => {
  res.json({ code: 0, message: "success", data: mockList });
});

app.post("/api/mock/list", (req, res) => {
  const payload = req.body?.item;
  const timestamp = Date.now();
  const mergedList = payload
    ? [
        {
          id: timestamp,
          name: payload?.name ?? `新增设备${timestamp}`,
          status: payload?.status ?? "pending",
        },
        ...mockList,
      ]
    : mockList;

  res.json({ code: 0, message: "success", data: mergedList });
});

app.listen(PORT, () => {
  console.log(`🚀 mock 服务已启动: http://localhost:${PORT}`);
  console.log("GET  /api/mock/list  -> 返回设备列表");
  console.log("POST /api/mock/list  -> 返回新增后的设备列表");
});
