-- Créer le profil pour l'utilisateur avec l'ID spécifique
INSERT INTO profiles (id, email, is_msp_admin, first_name, last_name)
VALUES (
    'ca42cc18-e102-4b27-9ea1-a99eccc8c8fe',
    'steeve.clotilde@opsway.fr',
    true,
    'Steeve',
    'CLOTILDE'
)
ON CONFLICT (id) DO UPDATE SET
    is_msp_admin = true;