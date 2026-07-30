-- =======================
-- ENABLE ROW LEVEL SECURITY
-- =======================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- =======================
-- USER PROFILES
-- =======================
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =======================
-- CONTACT STATUSES
-- =======================
CREATE POLICY "Users can view their own statuses"
  ON contact_statuses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own statuses"
  ON contact_statuses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own statuses"
  ON contact_statuses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own statuses"
  ON contact_statuses FOR DELETE
  USING (auth.uid() = user_id);

-- =======================
-- CONTACT SOURCES
-- =======================
CREATE POLICY "Users can view their own sources"
  ON contact_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sources"
  ON contact_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sources"
  ON contact_sources FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sources"
  ON contact_sources FOR DELETE
  USING (auth.uid() = user_id);

-- =======================
-- CONTACTS
-- =======================
CREATE POLICY "Users can view their own contacts"
  ON contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON contacts FOR DELETE
  USING (auth.uid() = user_id);

-- =======================
-- CONTACT CHANNELS
-- =======================
CREATE POLICY "Users can view channels of their contacts"
  ON contact_channels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_channels.contact_id
        AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert channels for their contacts"
  ON contact_channels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_channels.contact_id
        AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update channels of their contacts"
  ON contact_channels FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_channels.contact_id
        AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete channels of their contacts"
  ON contact_channels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_channels.contact_id
        AND contacts.user_id = auth.uid()
    )
  );

-- =======================
-- INTERACTIONS
-- =======================
CREATE POLICY "Users can view their own interactions"
  ON interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions"
  ON interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions"
  ON interactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions"
  ON interactions FOR DELETE
  USING (auth.uid() = user_id);

-- =======================
-- APPOINTMENTS
-- =======================
CREATE POLICY "Users can view their own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments"
  ON appointments FOR DELETE
  USING (auth.uid() = user_id);

-- =======================
-- PAYMENTS
-- =======================
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments"
  ON payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments"
  ON payments FOR DELETE
  USING (auth.uid() = user_id);

-- =======================
-- REMINDERS
-- =======================
CREATE POLICY "Users can view their own reminders"
  ON reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
  ON reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON reminders FOR DELETE
  USING (auth.uid() = user_id);
