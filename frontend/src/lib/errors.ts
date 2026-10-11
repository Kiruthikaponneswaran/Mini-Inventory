import axios from "axios";

/** Turns anything thrown by the API layer into a message safe to show a user. */
export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Can't reach the server. Check your connection and try again.";
    const { status, data } = err.response;
    if (status === 401) return "Your session has expired. Please sign in again.";
    if (status === 403) return "You don't have permission to do that.";
    if (status === 404) return "That item no longer exists.";
    if (status === 429) return "Too many attempts. Please wait a moment and try again.";
    if (status >= 500) return "The server ran into a problem. Please try again shortly.";
    if (data && typeof data === "object" && typeof (data as { detail?: unknown }).detail === "string") {
      return (data as { detail: string }).detail;
    }
  }
  return fallback;
}

export function getStatus(err: unknown): number | undefined {
  return axios.isAxiosError(err) ? err.response?.status : undefined;
}

export interface ParsedApiErrors {
  /** Messages keyed by field name, e.g. { price: "Price must be greater than 0." } */
  fields: Record<string, string>;
  /** Anything not attributable to a single field. */
  general: string | null;
}

/** Parses DRF's 400 body: { field: ["msg", ...], non_field_errors: [...] }. */
export function parseValidationErrors(err: unknown): ParsedApiErrors {
  const result: ParsedApiErrors = { fields: {}, general: null };
  if (!axios.isAxiosError(err) || err.response?.status !== 400) {
    result.general = getErrorMessage(err);
    return result;
  }
  const data = err.response.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const message = Array.isArray(value) ? value.map(String).join(" ") : String(value);
      if (key === "non_field_errors" || key === "detail") result.general = message;
      else result.fields[key] = message;
    }
  }
  if (!result.general && Object.keys(result.fields).length === 0) {
    result.general = getErrorMessage(err);
  }
  return result;
}
