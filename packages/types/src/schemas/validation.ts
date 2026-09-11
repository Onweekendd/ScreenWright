import type { ParsedLargeScreenInfo } from "../types/large-screen";
import { ParsedLargeScreenInfoSchema } from "./large-screen";

// ============================================
// Validation Functions
// ============================================

/**
 * Validate if data is a valid ParsedLargeScreenInfo
 * @throws {z.ZodError} If validation fails
 */
export function validateParsedLargeScreenInfo(data: unknown) {
  return ParsedLargeScreenInfoSchema.parse(data) as ParsedLargeScreenInfo;
}

/**
 * Safely validate ParsedLargeScreenInfo without throwing
 * @returns Success result with data or error result
 */
export function safeParseLargeScreenInfo(data: unknown) {
  return ParsedLargeScreenInfoSchema.safeParse(data);
}

/**
 * Check if data is a valid large screen (type guard)
 */
export function isValidLargeScreen(data: unknown): data is ParsedLargeScreenInfo {
  return ParsedLargeScreenInfoSchema.safeParse(data).success;
}
