export const DEFAULT_LIST_PAGE_SIZE = 20;
export const MAX_LIST_PAGE_SIZE = 50;

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

export class InvalidCursorError extends Error {
  constructor() {
    super("Invalid cursor");
    this.name = "InvalidCursorError";
  }
}

export function parseListPageSize(
  value: string | null,
  fallback = DEFAULT_LIST_PAGE_SIZE,
): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, 1), MAX_LIST_PAGE_SIZE);
}

export function parsePage(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? 1 : Math.max(parsed, 1);
}

export function getPageResult<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number,
): PageResult<T> {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

export function encodeCursor(id: string): string {
  return Buffer.from(JSON.stringify({ version: 1, id }), "utf8").toString("base64url");
}

export function decodeCursor(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
      version?: unknown;
      id?: unknown;
    };

    if (parsed.version !== 1 || typeof parsed.id !== "string" || parsed.id.length === 0) {
      throw new InvalidCursorError();
    }

    return parsed.id;
  } catch (error) {
    if (error instanceof InvalidCursorError) {
      throw error;
    }

    throw new InvalidCursorError();
  }
}

