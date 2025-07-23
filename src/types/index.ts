// Types ITSM
export type * from "./incident";
export type * from "./change";
export type * from "./sla";

// Types Services Métiers
export type * from "./businessService";

// Types Applications
export type * from "./application";

// Types de base
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
} 