import { NextResponse } from "next/server";

export type ErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "rate_limited"
  | "unsupported_media"
  | "payload_too_large"
  | "conflict"
  | "internal";

export function jsonError(
  code: ErrorCode,
  message: string,
  status: number,
) {
  return NextResponse.json({ error: message, code }, { status });
}

export function jsonData<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}
