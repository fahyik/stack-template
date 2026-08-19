import { supabase } from "./supabase";

const baseUrl = import.meta.env.VITE_API_URL;

if (!baseUrl) {
  throw new Error("Missing VITE_API_URL env var");
}

type QueryValue = string | number | boolean | undefined | null;

export type ApiFetchArgs = {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
};

export class ApiError extends Error {
  status: number;
  reason: string | undefined;
  issues: unknown;

  constructor(args: { status: number; reason?: string; issues?: unknown }) {
    super(args.reason ?? `api_error_${args.status}`);
    this.name = "ApiError";
    this.status = args.status;
    this.reason = args.reason;
    this.issues = args.issues;
  }
}

export async function apiFetch<T>({
  method,
  path,
  query,
  body,
}: ApiFetchArgs): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const url = new URL(path, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const parsed: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const reason =
      isObject(parsed) && typeof parsed.reason === "string"
        ? parsed.reason
        : undefined;
    const issues = isObject(parsed) ? parsed.issues : undefined;
    throw new ApiError({ status: response.status, reason, issues });
  }

  if (!isObject(parsed) || parsed.success !== true) {
    const reason =
      isObject(parsed) && typeof parsed.reason === "string"
        ? parsed.reason
        : "unexpected_response";
    throw new ApiError({ status: response.status, reason });
  }

  return parsed.data as T;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
