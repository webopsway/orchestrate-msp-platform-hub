-- Mettre à jour l'utilisateur actuel pour qu'il soit MSP admin
UPDATE profiles 
SET is_msp_admin = true 
WHERE id = auth.uid();