-- Créer le profil pour l'utilisateur actuel s'il n'existe pas
INSERT INTO profiles (id, email, is_msp_admin, first_name, last_name)
SELECT 
    auth.uid(),
    'steeve.clotilde@opsway.fr',
    true,
    'Steeve',
    'CLOTILDE'
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
);