/** 固定的工厂快照，供本地大屏和 API 数据绑定评测复用。 */
import productionLines from './production-lines.json';

export { productionLines };

const snapshotDate = '2026-09-10';

export const hourlyOutput = [
  { hour: '08:00', actual: 2400, target: 3000, defects: 24 },
  { hour: '09:00', actual: 2800, target: 3000, defects: 28 },
  { hour: '10:00', actual: 3100, target: 3500, defects: 31 },
  { hour: '11:00', actual: 2980, target: 3500, defects: 30 },
  { hour: '12:00', actual: 2200, target: 3000, defects: 22 },
  { hour: '13:00', actual: 3000, target: 4000, defects: 30 },
];

export const dailyOutput = Array.from({ length: 30 }, (_, index) => {
  const date = new Date(`${snapshotDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 29 + index);
  const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
  return {
    date: date.toISOString().slice(5, 10),
    output: weekend ? 0 : index === 29 ? 16480 : 15000 + (index % 5) * 400,
    target: weekend ? 0 : 20000,
  };
});

export const equipment = [
  { id: 'EQ001', name: '贴片机', line: 'L01', status: 'running', uptime: 98.2, lastMaintenance: '2026-09-01', nextMaintenance: '2026-10-01', temperature: 42 },
  { id: 'EQ002', name: '回流焊炉', line: 'L02', status: 'running', uptime: 96.5, lastMaintenance: '2026-09-02', nextMaintenance: '2026-10-02', temperature: 245 },
  { id: 'EQ003', name: '自动装配机', line: 'L03', status: 'warning', uptime: 85.1, lastMaintenance: '2026-08-15', nextMaintenance: '2026-09-15', temperature: 68 },
  { id: 'EQ004', name: '测试机', line: 'L04', status: 'running', uptime: 95.8, lastMaintenance: '2026-09-03', nextMaintenance: '2026-10-03', temperature: 36 },
  { id: 'EQ005', name: '备用贴片机', line: 'L05', status: 'idle', uptime: 0, lastMaintenance: '2026-09-05', nextMaintenance: '2026-10-05', temperature: 25 },
];

export const defectTypes = [
  { type: '焊接不良', count: 70, rate: 0.42, trend: 'down' },
  { type: '贴装偏移', count: 50, rate: 0.30, trend: 'up' },
  { type: '外观缺陷', count: 30, rate: 0.18, trend: 'stable' },
  { type: '功能异常', count: 15, rate: 0.09, trend: 'down' },
];

export const orders = [
  { id: 'PO-2026091001', customer: '华东电子', product: '控制板 A', quantity: 12000, completed: 5280, status: 'running', deadline: '2026-09-12', priority: 'urgent' },
  { id: 'PO-2026091002', customer: '南方科技', product: '传感器 B', quantity: 8000, completed: 0, status: 'pending', deadline: '2026-09-15', priority: 'high' },
  { id: 'PO-2026090901', customer: '北方电器', product: '电源模块 C', quantity: 5000, completed: 5000, status: 'done', deadline: '2026-09-10', priority: 'normal' },
];

export const energyConsumption = {
  todayKwh: 8240, monthKwh: 78400, costToday: 6592, costMonth: 62720, perUnitKwh: 0.5,
  hourly: hourlyOutput.map(({ hour, actual }) => ({ hour, kwh: actual * 0.5 })),
};

const totalOutput = productionLines.reduce((sum, line) => sum + line.output, 0);
const totalTarget = productionLines.reduce((sum, line) => sum + line.target, 0);

export const overview = {
  date: snapshotDate, shift: '白班 08:00-20:00', totalOutput, totalTarget,
  completionRate: Number((totalOutput / totalTarget * 100).toFixed(1)),
  overallEfficiency: 91.7, defectRate: 1,
  onlineEquipment: equipment.filter(({ status }) => status === 'running' || status === 'warning').length,
  totalEquipment: equipment.length,
  alerts: [{ level: 'warning', message: '组装一线设备温度偏高', time: '13:20:00', line: 'L03' }],
};

export const users = [
  { id: 1, name: '演示管理员', email: 'admin@example.com', role: 'admin', createdAt: snapshotDate },
  { id: 2, name: '演示用户', email: 'user@example.com', role: 'user', createdAt: snapshotDate },
];
