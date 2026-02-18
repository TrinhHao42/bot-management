export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export class PaginatedResponse<T> {
  success = true;
  data: T[];
  meta: PaginationMeta;

  constructor(data: T[], total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    this.data = data;
    this.meta = {
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
  }
}

export class StandardErrorResponse {
  success = false;
  error: {
    message: string;
    code: string | number;
    timestamp: string;
    path?: string;
  };
  meta?: any;

  constructor(message: string, code: string | number, path?: string) {
    this.error = {
      message,
      code,
      timestamp: new Date().toISOString(),
      path,
    };
  }
}
