-- =======================
-- ENABLE ROW LEVEL SECURITY
-- =======================
ALTER TABLE agency_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_interactions ENABLE ROW LEVEL SECURITY;

-- =======================
-- AGENCY STATUSES
-- =======================
CREATE POLICY "Users can view their own agency statuses"
  ON agency_statuses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agency statuses"
  ON agency_statuses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agency statuses"
  ON agency_statuses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agency statuses"
  ON agency_statuses FOR DELETE
  USING (auth.uid() = user_id);

-- =======================
-- AGENCY SOURCES
-- =======================
CREATE POLICY "Users can view their own agency sources"
  ON agency_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agency sources"
  ON agency_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agency sources"
  ON agency_sources FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agency sources"
  ON agency_sources FOR DELETE
  USING (auth.uid() = user_id);

-- =======================
-- AGENCIES
-- =======================
CREATE POLICY "Users can view their own agencies"
  ON agencies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agencies"
  ON agencies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agencies"
  ON agencies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agencies"
  ON agencies FOR DELETE
  USING (auth.uid() = user_id);

-- =======================
-- AGENCY INTERACTIONS
-- =======================
CREATE POLICY "Users can view their own agency interactions"
  ON agency_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agency interactions"
  ON agency_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agency interactions"
  ON agency_interactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agency interactions"
  ON agency_interactions FOR DELETE
  USING (auth.uid() = user_id);

-- Note : aucune modification des policies de `reminders` n'est nécessaire.
-- Elles filtrent déjà par `user_id`, indépendamment de quelle FK (contact_id/agency_id) est renseignée.
