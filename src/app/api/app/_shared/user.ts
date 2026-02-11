export const MAX_NAME_LENGTH = 50;
export const MAX_BIO_LENGTH = 500;
export const MAX_URL_LENGTH = 500;
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export const validPostViewModes = [
  "both",
  "title",
  "content",
  "titleAndContent",
] as const;

export type PostViewMode = (typeof validPostViewModes)[number];

export function getTrimmedParam(
  searchParams: URLSearchParams,
  key: string,
): string | null {
  const value = searchParams.get(key);
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parsePositiveInt(
  value: string | null,
  fallback: number,
  options?: { min?: number; max?: number },
): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  const min = options?.min ?? 1;
  const max = options?.max ?? Number.MAX_SAFE_INTEGER;

  if (parsed < min) {
    return min;
  }
  if (parsed > max) {
    return max;
  }

  return parsed;
}

export function getJoinedDays(createdAt: Date): number {
  const days = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(days, 1);
}

export function getPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
): {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
} {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

