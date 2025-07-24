export interface Document {
  id: string;
  team_id: string;
  title: string;
  content: string;
  version: string;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  tags?: string[];
  category?: string;
  status?: 'draft' | 'published' | 'archived';
  is_favorite?: boolean;
  description?: string;
  author?: string;
  last_editor?: string;
  view_count?: number;
  [key: string]: any;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  change_log?: string;
}

export interface DocumentFilters {
  search: string;
  category: string;
  status: string;
  team: string;
  tags: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export interface DocumentStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  favorites: number;
  recent: number;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  metadata: DocumentMetadata;
  created_at: string;
  updated_at: string;
}

export interface DocumentComment {
  id: string;
  document_id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  parent_id?: string;
  replies?: DocumentComment[];
}

export interface DocumentShare {
  id: string;
  document_id: string;
  shared_with: string;
  permissions: 'read' | 'write' | 'admin';
  created_by: string;
  created_at: string;
  expires_at?: string;
}

export interface DocumentActivity {
  id: string;
  document_id: string;
  user_id: string;
  action: 'created' | 'updated' | 'deleted' | 'viewed' | 'shared' | 'commented';
  details?: any;
  created_at: string;
} 