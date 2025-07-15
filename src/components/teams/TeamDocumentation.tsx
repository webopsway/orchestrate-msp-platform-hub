import { useState, useEffect } from 'react';
import { DocumentationService } from '@/services/documentationService';
import { useRBAC } from '@/hooks/useRBAC';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export const TeamDocumentation = ({ teamId, currentUserId }) => {
  const { checkPermission } = useRBAC();
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', version: '1.0' });

  useEffect(() => {
    DocumentationService.list(teamId).then(setDocs);
  }, [teamId]);

  const filteredDocs = docs.filter(doc =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setForm({ title: doc.title, content: doc.content || '', version: doc.version || '1.0' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce document ?')) {
      try {
        await DocumentationService.remove(id);
        setDocs(docs.filter(d => d.id !== id));
        toast.success('Document supprimé');
      } catch (e) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleSave = async () => {
    try {
      if (editingDoc) {
        const updated = await DocumentationService.update(editingDoc.id, { ...form, updated_by: currentUserId });
        setDocs(docs.map(d => d.id === editingDoc.id ? updated : d));
        toast.success('Document modifié');
      } else {
        const created = await DocumentationService.create({ ...form, team_id: teamId, created_by: currentUserId });
        setDocs([created, ...docs]);
        toast.success('Document créé');
      }
      setShowModal(false);
      setEditingDoc(null);
      setForm({ title: '', content: '', version: '1.0' });
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        {checkPermission('documentation', 'create') && (
          <Button onClick={() => { setEditingDoc(null); setForm({ title: '', content: '', version: '1.0' }); setShowModal(true); }}>Nouveau document</Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Auteur</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDocs.map(doc => (
            <TableRow key={doc.id}>
              <TableCell>{doc.title}</TableCell>
              <TableCell>{doc.version}</TableCell>
              <TableCell>{doc.created_by}</TableCell>
              <TableCell>{new Date(doc.updated_at).toLocaleDateString('fr-FR')}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" onClick={() => handleEdit(doc)}>Voir/Éditer</Button>
                {checkPermission('documentation', 'delete') && (
                  <Button variant="destructive" onClick={() => handleDelete(doc.id)}>Supprimer</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDoc ? 'Modifier le document' : 'Nouveau document'}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Titre"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="mb-2"
          />
          <Input
            placeholder="Version"
            value={form.version}
            onChange={e => setForm({ ...form, version: e.target.value })}
            className="mb-2"
          />
          <Textarea
            placeholder="Contenu (Markdown supporté)"
            value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
            rows={10}
            className="mb-2"
          />
          <div className="mb-2">
            <div className="font-bold mb-1">Aperçu :</div>
            <div className="border rounded p-2 bg-muted max-h-48 overflow-auto">
              <ReactMarkdown>{form.content}</ReactMarkdown>
            </div>
          </div>
          <Button onClick={handleSave}>{editingDoc ? 'Enregistrer' : 'Créer'}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 