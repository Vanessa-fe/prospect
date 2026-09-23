-- =======================
-- FONCTION POUR INITIALISER LES DONNÉES PAR DÉFAUT
-- Étend initialize_user_defaults (00003) avec les statuts/sources par défaut
-- de la pipeline "agences", pour n'avoir qu'une seule fonction à appeler
-- à l'onboarding.
-- =======================

CREATE OR REPLACE FUNCTION initialize_user_defaults(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  status_order INTEGER := 0;
  source_order INTEGER := 0;
  agency_status_order INTEGER := 0;
  agency_source_order INTEGER := 0;
BEGIN
  -- Insérer les statuts par défaut (contacts)
  INSERT INTO contact_statuses (user_id, name, color, "order", is_default) VALUES
    (target_user_id, 'Nouveau', '#3b82f6', status_order, true),
    (target_user_id, 'À répondre', '#f59e0b', status_order + 1, false),
    (target_user_id, 'En discussion', '#8b5cf6', status_order + 2, false),
    (target_user_id, 'Intéressé', '#10b981', status_order + 3, false),
    (target_user_id, 'Rendez-vous prévu', '#06b6d4', status_order + 4, false),
    (target_user_id, 'Client', '#22c55e', status_order + 5, false),
    (target_user_id, 'Client fidèle', '#84cc16', status_order + 6, false),
    (target_user_id, 'À relancer', '#f97316', status_order + 7, false),
    (target_user_id, 'Refusé', '#6b7280', status_order + 8, false),
    (target_user_id, 'Bloqué', '#ef4444', status_order + 9, false);

  -- Insérer les sources par défaut (contacts)
  INSERT INTO contact_sources (user_id, name, icon, "order") VALUES
    (target_user_id, 'Recommandation', 'users', source_order),
    (target_user_id, 'Site internet', 'globe', source_order + 1),
    (target_user_id, 'Réseau social', 'share-2', source_order + 2),
    (target_user_id, 'Plateforme', 'smartphone', source_order + 3),
    (target_user_id, 'Appel direct', 'phone', source_order + 4),
    (target_user_id, 'Autre', 'help-circle', source_order + 5);

  -- Insérer les statuts par défaut (agences)
  -- Le 8ᵉ statut "Pas intéressé" est un état terminal négatif ajouté pour
  -- que ces agences sortent de la vue "à faire aujourd'hui" ; modifiable/
  -- supprimable ensuite depuis les paramètres, ce n'est que de la donnée seed.
  INSERT INTO agency_statuses (user_id, name, color, "order", is_default) VALUES
    (target_user_id, 'À contacter', '#3b82f6', agency_status_order, true),
    (target_user_id, 'Contacté', '#f59e0b', agency_status_order + 1, false),
    (target_user_id, 'Relance 1', '#8b5cf6', agency_status_order + 2, false),
    (target_user_id, 'Relance 2', '#6366f1', agency_status_order + 3, false),
    (target_user_id, 'Répondu', '#06b6d4', agency_status_order + 4, false),
    (target_user_id, 'RDV', '#10b981', agency_status_order + 5, false),
    (target_user_id, 'À recontacter dans 3 mois', '#84cc16', agency_status_order + 6, false),
    (target_user_id, 'Pas intéressé', '#6b7280', agency_status_order + 7, false);

  -- Insérer les sources par défaut (agences)
  INSERT INTO agency_sources (user_id, name, icon, "order") VALUES
    (target_user_id, 'LinkedIn', 'linkedin', agency_source_order),
    (target_user_id, 'Offre d''emploi', 'briefcase', agency_source_order + 1),
    (target_user_id, 'Recherche Google', 'search', agency_source_order + 2),
    (target_user_id, 'Recommandation', 'users', agency_source_order + 3),
    (target_user_id, 'Réseau perso', 'network', agency_source_order + 4),
    (target_user_id, 'Autre', 'help-circle', agency_source_order + 5);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION initialize_user_defaults IS 'Initialise les statuts et sources par défaut pour un nouvel utilisateur (contacts et agences)';
