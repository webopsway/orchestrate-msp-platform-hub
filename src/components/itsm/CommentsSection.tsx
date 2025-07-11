import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, User, Clock, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  metadata?: any;
}

interface CommentsSectionProps {
  ticketId: string;
  ticketType: 'incident' | 'change_request' | 'vulnerability';
  readonly?: boolean;
}

export function CommentsSection({ ticketId, ticketType, readonly = false }: CommentsSectionProps) {
  const { user, sessionContext } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    fetchComments();
  }, [ticketId, ticketType]);

  const getColumnName = () => {
    switch (ticketType) {
      case 'incident':
        return 'incident_id';
      case 'change_request':
        return 'change_request_id';
      case 'vulnerability':
        return 'vulnerability_id';
      default:
        return 'incident_id';
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const columnName = getColumnName();
      
      const { data, error } = await supabase
        .from('itsm_comments')
        .select('*')
        .eq(columnName, ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Erreur lors du chargement des commentaires');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      setSubmitting(true);
      const columnName = getColumnName();
      
      const insertData: any = {
        content: newComment.trim(),
        created_by: user.id,
        team_id: sessionContext?.current_team_id,
      };
      insertData[columnName] = ticketId;
      
      const { error } = await supabase
        .from('itsm_comments')
        .insert([insertData]);

      if (error) throw error;

      setNewComment("");
      toast.success('Commentaire ajouté');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Erreur lors de l\'ajout du commentaire');
    } finally {
      setSubmitting(false);
    }
  };

  const updateComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('itsm_comments')
        .update({ content: editContent.trim() })
        .eq('id', commentId);

      if (error) throw error;

      setEditingId(null);
      setEditContent("");
      toast.success('Commentaire modifié');
      fetchComments();
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('itsm_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Commentaire supprimé');
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Commentaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Commentaires
          <Badge variant="secondary">{comments.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Liste des commentaires */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun commentaire pour le moment
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium text-sm">
                      {comment.created_by}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(comment.created_at).toLocaleDateString('fr-FR')} {new Date(comment.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {comment.updated_at !== comment.created_at && (
                      <Badge variant="outline" className="text-xs">
                        Modifié
                      </Badge>
                    )}
                  </div>
                  
                  {!readonly && comment.created_by === user?.id && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(comment)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteComment(comment.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Modifier le commentaire..."
                      className="min-h-[60px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateComment(comment.id)}
                        disabled={!editContent.trim()}
                      >
                        Sauvegarder
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Formulaire d'ajout */}
        {!readonly && (
          <div className="border-t pt-4">
            <div className="space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="min-h-[80px]"
              />
              <div className="flex justify-end">
                <Button
                  onClick={addComment}
                  disabled={!newComment.trim() || submitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? 'Envoi...' : 'Envoyer'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}