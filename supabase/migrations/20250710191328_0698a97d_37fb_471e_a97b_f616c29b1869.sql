-- Create documentation table
CREATE TABLE public.documentation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    created_by UUID NOT NULL REFERENCES profiles(id),
    updated_by UUID NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB NULL DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX idx_documentation_team_id ON public.documentation(team_id);
CREATE INDEX idx_documentation_created_at ON public.documentation(created_at);
CREATE INDEX idx_documentation_version ON public.documentation(version);

-- Enable RLS on documentation table
ALTER TABLE public.documentation ENABLE ROW LEVEL SECURITY;

-- RLS policy for team isolation
CREATE POLICY "docs_team_isolation" 
ON public.documentation 
FOR ALL 
USING (
    COALESCE(current_setting('app.is_msp', true)::boolean, false) = true 
    OR team_id = COALESCE(current_setting('app.current_team', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
)
WITH CHECK (
    COALESCE(current_setting('app.is_msp', true)::boolean, false) = true 
    OR team_id = COALESCE(current_setting('app.current_team', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
);

-- RLS policy for manager scope
CREATE POLICY "docs_manager_scope" 
ON public.documentation 
FOR SELECT 
USING (
    COALESCE(current_setting('app.is_msp', true)::boolean, false) = true 
    OR EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN teams t ON om.organization_id = t.organization_id
        WHERE om.user_id = auth.uid() 
        AND om.role IN ('admin', 'manager')
        AND t.id = documentation.team_id
    )
);

-- RLS policy for MSP access
CREATE POLICY "docs_msp_access" 
ON public.documentation 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() 
        AND p.is_msp_admin = true
    )
);

-- Create storage bucket for generated documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

-- Storage policies for documents
CREATE POLICY "Users can view their team documents" 
ON storage.objects 
FOR SELECT 
USING (
    bucket_id = 'documents' 
    AND (
        COALESCE(current_setting('app.is_msp', true)::boolean, false) = true
        OR (storage.foldername(name))[1] = COALESCE(current_setting('app.current_team', true), '00000000-0000-0000-0000-000000000000')
    )
);

CREATE POLICY "Users can upload documents for their team" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
    bucket_id = 'documents' 
    AND (
        COALESCE(current_setting('app.is_msp', true)::boolean, false) = true
        OR (storage.foldername(name))[1] = COALESCE(current_setting('app.current_team', true), '00000000-0000-0000-0000-000000000000')
    )
);

-- Trigger for updated_at on documentation
CREATE TRIGGER update_documentation_updated_at
    BEFORE UPDATE ON public.documentation
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create new version of a document
CREATE OR REPLACE FUNCTION public.create_document_version(
    doc_id UUID,
    new_title TEXT DEFAULT NULL,
    new_content TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    original_doc RECORD;
    new_version TEXT;
    new_doc_id UUID;
BEGIN
    -- Get original document
    SELECT * INTO original_doc 
    FROM public.documentation 
    WHERE id = doc_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Document not found';
    END IF;
    
    -- Calculate new version (increment last number)
    new_version := CASE 
        WHEN original_doc.version ~ '^[0-9]+\.[0-9]+$' THEN
            SPLIT_PART(original_doc.version, '.', 1) || '.' || 
            (SPLIT_PART(original_doc.version, '.', 2)::int + 1)::text
        ELSE
            original_doc.version || '.1'
    END;
    
    -- Insert new version
    INSERT INTO public.documentation (
        team_id,
        title,
        content,
        version,
        created_by,
        metadata
    ) VALUES (
        original_doc.team_id,
        COALESCE(new_title, original_doc.title),
        COALESCE(new_content, original_doc.content),
        new_version,
        auth.uid(),
        jsonb_build_object(
            'original_doc_id', original_doc.id,
            'original_version', original_doc.version
        )
    ) RETURNING id INTO new_doc_id;
    
    RETURN new_doc_id;
END;
$$;