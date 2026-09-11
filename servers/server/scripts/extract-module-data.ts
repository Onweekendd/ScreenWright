import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SQL 文件路径
const sqlFilePath = path.resolve(__dirname, "../src/mastra/vector/component-docs/bi_platform_new_t_module.sql");
// 输出 JSON 文件路径
const jsonOutputPath = path.resolve(__dirname, "../src/mastra/vector/component-docs/modules-data.json");

/**
 * 解析字符串值（处理转义字符）
 */
function parseStringValue(str: string): string {
  // 移除首尾引号
  let value = str.trim();
  if (value.startsWith("'") && value.endsWith("'")) {
    value = value.slice(1, -1);
  }
  // 处理转义字符
  value = value.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  return value;
}

/**
 * 解析单个字段值
 */
function parseField(field: string): any {
  field = field.trim();
  if (field === "NULL") {
    return null;
  }
  // 数字类型
  if (/^\d+$/.test(field)) {
    return parseInt(field);
  }
  // 字符串类型
  return parseStringValue(field);
}

/**
 * 智能解析 INSERT VALUES 语句
 * 使用状态机逐字符解析
 */
function parseInsertValues(valuesStr: string): any[] {
  const records: any[] = [];
  const currentRecord: any[] = [];
  let currentField = "";
  let inQuotes = false;
  let parenDepth = 0; // 用于处理嵌套的括号（JSON 中的）
  let escapeNext = false;

  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];
    const nextChar = valuesStr[i + 1];

    if (escapeNext) {
      currentField += char;
      escapeNext = false;
      continue;
    }

    if (char === "\\" && inQuotes) {
      escapeNext = true;
      currentField += char;
      continue;
    }

    if (char === "'") {
      inQuotes = !inQuotes;
      currentField += char;
      continue;
    }

    if (inQuotes) {
      currentField += char;
      continue;
    }

    // 不在引号内，处理分隔符
    if (char === "," && parenDepth === 0) {
      // 字段分隔符
      currentRecord.push(parseField(currentField));
      currentField = "";
    } else if (char === "(" && nextChar !== ",") {
      // 可能是记录开始或 JSON 中的括号
      if (currentField.trim() === "" && currentRecord.length === 0) {
        // 新记录开始
        currentField = "";
      } else {
        parenDepth++;
        currentField += char;
      }
    } else if (char === ")") {
      if (parenDepth > 0) {
        // JSON 中的括号
        parenDepth--;
        currentField += char;
      } else {
        // 记录结束
        if (currentField.trim() !== "") {
          currentRecord.push(parseField(currentField));
        }

        // 检查是否是完整的记录（15个字段）
        if (currentRecord.length === 15) {
          records.push(convertRecordToObject(currentRecord));
        } else if (currentRecord.length > 0) {
          console.warn(`跳过不完整的记录，字段数: ${currentRecord.length}`);
        }

        currentRecord.length = 0;
        currentField = "";

        // 跳过下一个逗号
        if (nextChar === ",") {
          i++;
        }
      }
    } else {
      currentField += char;
    }
  }

  return records;
}

/**
 * 将记录数组转换为对象
 */
function convertRecordToObject(fields: any[]): any {
  return {
    id: fields[0],
    user_id: fields[1],
    type: fields[2],
    java_script: fields[3],
    level: fields[4],
    second_level_menu: fields[5],
    first_level_menu: fields[6],
    name: fields[7],
    thumbnail: fields[8],
    created_by: fields[9],
    created_time: parseDateTime(fields[10]),
    updated_by: fields[11],
    updated_time: parseDateTime(fields[12]),
    template: fields[13],
    status: fields[14]
  };
}

/**
 * 解析 MySQL datetime 字符串为 ISO 格式
 */
function parseDateTime(dateStr: any): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;

  // MySQL 格式: "2023-05-31 12:34:25"
  const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
  }

  return dateStr;
}

/**
 * 主函数：读取 SQL 文件并提取数据
 */
async function extractModuleData() {
  console.log("开始解析 modules.sql 文件...");

  if (!fs.existsSync(sqlFilePath)) {
    console.error(`文件不存在: ${sqlFilePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(sqlFilePath, "utf-8");
  const lines = content.split("\n");

  const allRecords: any[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("INSERT INTO `t_module`")) {
      // 提取 VALUES 后面的部分
      const valuesMatch = trimmedLine.match(/INSERT INTO `t_module` VALUES (.+);/);
      if (valuesMatch) {
        const valuesStr = valuesMatch[1];
        const records = parseInsertValues(valuesStr);
        allRecords.push(...records);
        console.log(`从一行中提取了 ${records.length} 条记录`);
      }
    }
  }

  console.log(`\n总共找到 ${allRecords.length} 条记录`);

  // 写入 JSON 文件
  fs.writeFileSync(jsonOutputPath, JSON.stringify(allRecords, null, 2), "utf-8");
  console.log(`数据已导出到: ${jsonOutputPath}`);

  return allRecords.length;
}

extractModuleData()
  .then((count) => {
    console.log(`\n✓ 成功提取 ${count} 条 Module 数据`);
  })
  .catch((error) => {
    console.error("✗ 提取数据失败:", error);
    process.exit(1);
  });
