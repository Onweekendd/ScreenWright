import type { AppCodeTaskError } from "../contracts/app-code-task-error";
import type { AppSandbox } from "./app-sandbox";

export type SandboxAcquisitionErrorCode = AppCodeTaskError.APP_NOT_FOUND | AppCodeTaskError.SANDBOX_UNAVAILABLE;

export class SandboxAcquisitionError extends Error {
  constructor(
    readonly code: SandboxAcquisitionErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "SandboxAcquisitionError";
  }
}

export interface SandboxManager {
  acquire(appId: string): Promise<AppSandbox>;
  release(sandbox: AppSandbox): Promise<void>;
}
