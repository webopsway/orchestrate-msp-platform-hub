export interface DocumentContentBlock {
  id: string;
  document_id: string;
  block_type: 'markdown' | 'excalidraw' | 'drawio';
  content: any;
  position: number;
  title?: string;
  metadata: {
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
  created_by: string;
  team_id: string;
}

export interface ExcalidrawData {
  elements: any[];
  appState: any;
  files?: any;
}

export interface DrawIOData {
  xml: string;
  title?: string;
}

export interface MarkdownData {
  content: string;
}