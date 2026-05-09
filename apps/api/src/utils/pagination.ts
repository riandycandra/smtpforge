import { Request } from 'express';

export interface PaginationParams {
  limit: number;
  offset: number;
  page: number;
}

export function getPagination(req: Request, defaultLimit = 10): PaginationParams {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : defaultLimit;
  
  const validPage = page > 0 ? page : 1;
  const validLimit = limit > 0 && limit <= 100 ? limit : defaultLimit;
  
  const offset = (validPage - 1) * validLimit;

  return { limit: validLimit, offset, page: validPage };
}

export function getPagingData(data: any, page: number, limit: number) {
  const { count: total, rows } = data;
  return {
    data: rows,
    meta: {
      page,
      limit,
      total,
    }
  };
}
