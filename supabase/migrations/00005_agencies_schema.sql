-- =======================
-- AGENCY STATUSES
-- =======================
CREATE TABLE agency_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_agency_statuses_user_id ON agency_statuses(user_id);
CREATE INDEX idx_agency_statuses_order ON agency_statuses(user_id, "order");

COMMENT ON TABLE agency_statuses IS 'Statuts personnalisables par utilisateur pour classer les agences';

-- =======================
-- AGENCY SOURCES
-- =======================
CREATE TABLE agency_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_agency_sources_user_id ON agency_sources(user_id);
CREATE INDEX idx_agency_sources_order ON agency_sources(user_id, "order");

COMMENT ON TABLE agency_sources IS 'Sources personnalisables pour identifier l''origine des agences';

-- =======================
-- AGENCIES
-- =======================
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  city TEXT,
  size_range TEXT CHECK (size_range IN ('1-5', '6-15', '16-50', '50+')),
  detected_stack TEXT[] DEFAULT '{}',
  stack_detected_at TIMESTAMPTZ,
  stack_evidence JSONB,
  signal_type TEXT CHECK (signal_type IN ('job_posting_dev', 'nextjs_portfolio', 'ai_offer', 'other')),
  signal_url TEXT,
  signal_detected_at TIMESTAMPTZ,
  contact_name TEXT,
  contact_role TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  preferred_channel TEXT CHECK (preferred_channel IN ('email', 'linkedin', 'phone', 'other')),
  status_id UUID REFERENCES agency_statuses(id) ON DELETE SET NULL,
  source_id UUID REFERENCES agency_sources(id) ON DELETE SET NULL,
  notes TEXT,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agencies_user_id ON agencies(user_id);
CREATE INDEX idx_agencies_status_id ON agencies(status_id);
CREATE INDEX idx_agencies_source_id ON agencies(source_id);
CREATE INDEX idx_agencies_last_interaction ON agencies(user_id, last_interaction_at DESC NULLS LAST);
CREATE INDEX idx_agencies_detected_stack ON agencies USING GIN (detected_stack);

COMMENT ON TABLE agencies IS 'Agences web prospectées pour de la sous-traitance (deuxième pipeline, distincte des contacts)';
COMMENT ON COLUMN agencies.size_range IS 'Fourchette d''effectif de l''agence: 1-5, 6-15, 16-50, 50+';
COMMENT ON COLUMN agencies.detected_stack IS 'Technologies détectées automatiquement (ex: nextjs, react, wordpress, webflow), filtrable via @> et index GIN';
COMMENT ON COLUMN agencies.stack_evidence IS 'Détail JSON des motifs ayant permis la détection de chaque technologie';
COMMENT ON COLUMN agencies.signal_type IS 'Signal déclencheur ayant motivé la prospection de cette agence';

-- =======================
-- AGENCY INTERACTIONS
-- =======================
CREATE TABLE agency_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'message', 'call_incoming', 'call_outgoing',
    'call_missed', 'note', 'reminder', 'system_event'
  )),
  channel TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  content TEXT,
  duration INTEGER,
  direction TEXT CHECK (direction IN ('incoming', 'outgoing')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agency_interactions_user_id ON agency_interactions(user_id);
CREATE INDEX idx_agency_interactions_agency_id ON agency_interactions(agency_id);
CREATE INDEX idx_agency_interactions_occurred_at ON agency_interactions(user_id, occurred_at DESC);
CREATE INDEX idx_agency_interactions_type ON agency_interactions(agency_id, type);

COMMENT ON TABLE agency_interactions IS 'Historique de toutes les interactions avec les agences (table jumelle de interactions, pour isoler le risque de casser la timeline des contacts)';
COMMENT ON COLUMN agency_interactions.duration IS 'Durée en secondes pour les appels';

-- =======================
-- REMINDERS : extension pour les agences
-- =======================
-- reminders.contact_id est déjà nullable et ne porte aucune règle métier
-- spécifique aux contacts : on réutilise la table plutôt que d'en dupliquer une.
ALTER TABLE reminders ADD COLUMN agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;

ALTER TABLE reminders ADD CONSTRAINT reminders_single_target_check
  CHECK (NOT (contact_id IS NOT NULL AND agency_id IS NOT NULL));

CREATE INDEX idx_reminders_agency_id ON reminders(agency_id) WHERE agency_id IS NOT NULL;

COMMENT ON COLUMN reminders.agency_id IS 'Agence associée à la relance (mutuellement exclusif avec contact_id)';

-- =======================
-- TRIGGERS
-- =======================

-- Trigger pour mettre à jour updated_at (réutilise la fonction générique de 00001)
CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour last_interaction_at (copie du trigger existant sur interactions)
CREATE OR REPLACE FUNCTION update_agency_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE agencies
  SET last_interaction_at = NEW.occurred_at
  WHERE id = NEW.agency_id
    AND (last_interaction_at IS NULL OR last_interaction_at < NEW.occurred_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agency_last_interaction_trigger
  AFTER INSERT ON agency_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_agency_last_interaction();
