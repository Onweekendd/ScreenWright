import fs from "fs";
import path from "path";

export const Logger = {
  isHTTP: false,
  log: (...args: any[]) => {
    if (Logger.isHTTP) {
      console.log("[INFO]", ...args);
    } else {
      console.error("[INFO]", ...args);
    }
  },
  error: (...args: any[]) => {
    console.error("[ERROR]", ...args);
  }
};

export function writeLogsToWorkspace(name: string, value: any): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  try {
    const logsDir = "workspace";
    const logPath = `${logsDir}/${name}`;

    // Check if we can write to the current directory
    fs.accessSync(process.cwd(), fs.constants.W_OK);

    // Create full directory path if it doesn't exist
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(logPath, JSON.stringify(value, null, 2));
    Logger.log(`Debug log written to: ${logPath}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.log(`Failed to write logs to ${name}: ${errorMessage}`);
  }
}
