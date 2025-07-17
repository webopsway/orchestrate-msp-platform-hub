-- Create content blocks table for rich documentation
CREATE TABLE public.document_content_blocks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.team_documents(id) ON DELETE CASCADE,
    block_type TEXT NOT NULL CHECK (block_type IN ('markdown', 'excalidraw', 'drawio')),
    content JSONB NOT NULL DEFAULT '{}',
    position INTEGER NOT NULL DEFAULT 0,
    title TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    team_id UUID NOT NULL REFERENCES public.teams(id)
);

-- Enable RLS
ALTER TABLE public.document_content_blocks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "MSP admin accès total document_content_blocks" 
ON public.document_content_blocks 
FOR ALL 
USING (is_msp_admin())
WITH CHECK (is_msp_admin());

CREATE POLICY "Team members can access their document blocks"
ON public.document_content_blocks
FOR ALL
USING (
    is_msp_admin() OR 
    (is_user_in_msp_organization() AND user_has_permission('documentation', 'read')) OR
    (EXISTS (
        SELECT 1 FROM team_memberships tm
        WHERE tm.user_id = auth.uid() AND tm.team_id = document_content_blocks.team_id
    ))
)
WITH CHECK (
    is_msp_admin() OR 
    (is_user_in_msp_organization() AND user_has_permission('documentation', 'create')) OR
    (EXISTS (
        SELECT 1 FROM team_memberships tm
        WHERE tm.user_id = auth.uid() AND tm.team_id = document_content_blocks.team_id
    ))
);

-- Create index for better performance
CREATE INDEX idx_document_content_blocks_document_id ON public.document_content_blocks(document_id);
CREATE INDEX idx_document_content_blocks_position ON public.document_content_blocks(document_id, position);

-- Add trigger for updated_at
CREATE TRIGGER update_document_content_blocks_updated_at
    BEFORE UPDATE ON public.document_content_blocks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();