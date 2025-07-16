-- Mettre à jour la fonction create_document_version pour utiliser team_documents
CREATE OR REPLACE FUNCTION public.create_document_version(doc_id uuid, new_title text DEFAULT NULL::text, new_content text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    original_doc RECORD;
    new_version TEXT;
    new_doc_id UUID;
BEGIN
    -- Get original document
    SELECT * INTO original_doc 
    FROM public.team_documents 
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
    INSERT INTO public.team_documents (
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
$function$;