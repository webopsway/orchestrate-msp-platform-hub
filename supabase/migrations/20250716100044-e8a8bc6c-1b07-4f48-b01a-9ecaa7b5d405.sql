-- Ajouter les politiques RLS manquantes pour msp_client_relations et itsm_service_requests

-- MSP Client Relations - déjà a RLS activé mais pas de politiques !
CREATE POLICY "msp_admins_full_access_msp_client_relations" 
ON public.msp_client_relations 
FOR ALL 
USING (is_msp_admin()) 
WITH CHECK (is_msp_admin());

-- ITSM Service Requests - déjà a RLS activé mais pas de politiques ! 
CREATE POLICY "msp_admins_full_access_itsm_service_requests" 
ON public.itsm_service_requests 
FOR ALL 
USING (is_msp_admin()) 
WITH CHECK (is_msp_admin());

-- Vérifier que toutes les tables importantes ont bien RLS activé et des politiques
-- Tables déjà vérifiées dans les migrations précédentes, toutes sont couvertes maintenant