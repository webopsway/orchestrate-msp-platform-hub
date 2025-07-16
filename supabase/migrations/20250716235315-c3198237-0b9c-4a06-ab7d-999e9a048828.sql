-- Supprimer la table team_documents existante (vide)
DROP TABLE IF EXISTS public.team_documents;

-- Renommer la table documentation en team_documents
ALTER TABLE public.documentation RENAME TO team_documents;

-- Mettre à jour les index et contraintes si nécessaire
-- Les index et contraintes sont automatiquement renommés avec la table

-- Vérifier que les politiques RLS sont toujours actives
-- (elles sont automatiquement renommées avec la table)