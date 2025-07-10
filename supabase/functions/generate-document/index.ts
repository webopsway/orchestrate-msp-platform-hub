import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateDocumentRequest {
  document_id: string;
  format: 'pdf' | 'markdown';
  team_id?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const generateMarkdown = (title: string, content: string, version: string, metadata: any) => {
  const date = new Date().toLocaleDateString('fr-FR');
  
  return `# ${title}

**Version:** ${version}  
**Généré le:** ${date}

---

${content || 'Aucun contenu disponible.'}

---

*Document généré automatiquement par le système de documentation*
`;
};

const generatePDF = async (title: string, content: string, version: string) => {
  // Pour une vraie implémentation PDF, on utiliserait une librairie comme Puppeteer
  // Ici, on simule la génération en créant un HTML qui peut être converti
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .meta { 
            background: #f5f5f5; 
            padding: 10px; 
            border-left: 4px solid #007cba; 
            margin: 20px 0; 
        }
        .content { margin: 20px 0; }
        .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
            font-size: 0.9em; 
            color: #666; 
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    
    <div class="meta">
        <strong>Version:</strong> ${version}<br>
        <strong>Généré le:</strong> ${new Date().toLocaleDateString('fr-FR')}
    </div>
    
    <div class="content">
        ${content ? content.replace(/\n/g, '<br>') : 'Aucun contenu disponible.'}
    </div>
    
    <div class="footer">
        <em>Document généré automatiquement par le système de documentation</em>
    </div>
</body>
</html>`;

  // En production, vous utiliseriez une vraie librairie PDF
  // Pour cette démo, on retourne le HTML
  return new TextEncoder().encode(htmlContent);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_id, format, team_id }: GenerateDocumentRequest = await req.json();

    if (!document_id || !format) {
      return new Response(JSON.stringify({ error: 'document_id and format are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Set team context if provided
    if (team_id) {
      await supabase.rpc('set_app_session_variables', {
        p_team_id: team_id,
        p_is_msp: false
      });
    }

    // Fetch document
    const { data: document, error: docError } = await supabase
      .from('documentation')
      .select('*')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      return new Response(JSON.stringify({ error: 'Document not found or access denied' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    let fileContent: Uint8Array;
    let fileName: string;
    let contentType: string;

    if (format === 'markdown') {
      const markdown = generateMarkdown(
        document.title,
        document.content,
        document.version,
        document.metadata
      );
      fileContent = new TextEncoder().encode(markdown);
      fileName = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}_v${document.version}.md`;
      contentType = 'text/markdown';
    } else if (format === 'pdf') {
      fileContent = await generatePDF(
        document.title,
        document.content,
        document.version
      );
      fileName = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}_v${document.version}.html`;
      contentType = 'text/html'; // En production, ce serait 'application/pdf'
    } else {
      return new Response(JSON.stringify({ error: 'Invalid format. Use "pdf" or "markdown"' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Upload to storage
    const filePath = `${document.team_id}/${document_id}/${fileName}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, fileContent, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to upload document' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Generate signed URL for download
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (urlError) {
      console.error('Signed URL error:', urlError);
      return new Response(JSON.stringify({ error: 'Failed to generate download URL' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log(`Generated ${format} document for team ${document.team_id}: ${fileName}`);

    return new Response(JSON.stringify({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        version: document.version,
        format
      },
      download_url: signedUrlData.signedUrl,
      file_name: fileName,
      expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error generating document:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

serve(handler);