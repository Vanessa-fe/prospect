-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================
-- USER PROFILE
-- =======================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  business_name TEXT,
  business_type TEXT,
  avatar_url TEXT,
  selected_theme TEXT DEFAULT 'minimal',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_profiles IS 'Profil utilisateur avec informations personnalisées';
COMMENT ON COLUMN user_profiles.selected_theme IS 'Thème sélectionné parmi: minimal, pink-candy, dark-violet, sage, ocean, sunset';

-- =======================
-- CONTACT STATUSES
-- =======================
CREATE TABLE contact_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_contact_statuses_user_id ON contact_statuses(user_id);
CREATE INDEX idx_contact_statuses_order ON contact_statuses(user_id, "order");

COMMENT ON TABLE contact_statuses IS 'Statuts personnalisables par utilisateur pour classer les contacts';

-- =======================
-- CONTACT SOURCES
-- =======================
CREATE TABLE contact_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_contact_sources_user_id ON contact_sources(user_id);
CREATE INDEX idx_contact_sources_order ON contact_sources(user_id, "order");

COMMENT ON TABLE contact_sources IS 'Sources personnalisables pour identifier l''origine des contacts';

-- =======================
-- CONTACTS
-- =======================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  nickname TEXT,
  phone TEXT,
  email TEXT,
  age INTEGER,
  city TEXT,
  source_id UUID REFERENCES contact_sources(id) ON DELETE SET NULL,
  status_id UUID REFERENCES contact_statuses(id) ON DELETE SET NULL,
  favorite BOOLEAN DEFAULT FALSE,
  risk_level TEXT DEFAULT 'normal' CHECK (risk_level IN ('normal', 'monitor', 'insistent', 'blocked')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ
);

CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_phone ON contacts(user_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_contacts_email ON contacts(user_id, email) WHERE email IS NOT NULL;
CREATE INDEX idx_contacts_status_id ON contacts(status_id);
CREATE INDEX idx_contacts_source_id ON contacts(source_id);
CREATE INDEX idx_contacts_favorite ON contacts(user_id, favorite) WHERE favorite = TRUE;
CREATE INDEX idx_contacts_risk_level ON contacts(user_id, risk_level) WHERE risk_level != 'normal';
CREATE INDEX idx_contacts_last_interaction ON contacts(user_id, last_interaction_at DESC NULLS LAST);

COMMENT ON TABLE contacts IS 'Contacts du CRM avec toutes leurs informations';
COMMENT ON COLUMN contacts.phone IS 'Numéro de téléphone normalisé au format international';
COMMENT ON COLUMN contacts.risk_level IS 'Niveau de risque détecté: normal, monitor, insistent, blocked';

-- =======================
-- CONTACT CHANNELS
-- =======================
CREATE TABLE contact_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN (
    'whatsapp', 'sms', 'telegram', 'signal', 'phone',
    'instagram', 'email', 'website', 'other'
  )),
  username TEXT,
  external_identifier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, channel_type, username)
);

CREATE INDEX idx_contact_channels_contact_id ON contact_channels(contact_id);

COMMENT ON TABLE contact_channels IS 'Plateformes et canaux de communication associés à un contact';

-- =======================
-- INTERACTIONS
-- =======================
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
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

CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_contact_id ON interactions(contact_id);
CREATE INDEX idx_interactions_occurred_at ON interactions(user_id, occurred_at DESC);
CREATE INDEX idx_interactions_type ON interactions(contact_id, type);

COMMENT ON TABLE interactions IS 'Historique de toutes les interactions avec les contacts';
COMMENT ON COLUMN interactions.duration IS 'Durée en secondes pour les appels';

-- =======================
-- APPOINTMENTS
-- =======================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  location TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'
  )),
  notes TEXT,
  reminder_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_contact_id ON appointments(contact_id);
CREATE INDEX idx_appointments_start_at ON appointments(user_id, start_at);
CREATE INDEX idx_appointments_status ON appointments(user_id, status);
CREATE INDEX idx_appointments_reminder ON appointments(user_id, reminder_at) WHERE reminder_at IS NOT NULL;

COMMENT ON TABLE appointments IS 'Rendez-vous planifiés avec les contacts';

-- =======================
-- PAYMENTS
-- =======================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  deposit_amount DECIMAL(10, 2) DEFAULT 0 CHECK (deposit_amount >= 0),
  payment_method TEXT CHECK (payment_method IN (
    'cash', 'card', 'transfer', 'check', 'paypal', 'other'
  )),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'partial', 'paid', 'refunded'
  )),
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_contact_id ON payments(contact_id);
CREATE INDEX idx_payments_paid_at ON payments(user_id, paid_at DESC NULLS LAST);
CREATE INDEX idx_payments_status ON payments(user_id, payment_status);
CREATE INDEX idx_payments_appointment ON payments(appointment_id) WHERE appointment_id IS NOT NULL;

COMMENT ON TABLE payments IS 'Paiements enregistrés avec possibilité d''acomptes';
COMMENT ON COLUMN payments.deposit_amount IS 'Montant de l''acompte versé';

-- =======================
-- REMINDERS
-- =======================
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_contact_id ON reminders(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_reminders_due_at ON reminders(user_id, due_at);
CREATE INDEX idx_reminders_completed ON reminders(user_id, completed_at) WHERE completed_at IS NULL;
CREATE INDEX idx_reminders_priority ON reminders(user_id, priority, due_at);

COMMENT ON TABLE reminders IS 'Rappels et relances avec priorités';

-- =======================
-- TRIGGERS
-- =======================

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour last_interaction_at
CREATE OR REPLACE FUNCTION update_contact_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contacts
  SET last_interaction_at = NEW.occurred_at
  WHERE id = NEW.contact_id
    AND (last_interaction_at IS NULL OR last_interaction_at < NEW.occurred_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_last_interaction_trigger
  AFTER INSERT ON interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_last_interaction();

-- Fonction pour vérifier les contraintes de deposit_amount
CREATE OR REPLACE FUNCTION check_deposit_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deposit_amount > NEW.amount THEN
    RAISE EXCEPTION 'Le montant de l''acompte ne peut pas être supérieur au montant total';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_deposit_amount_trigger
  BEFORE INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION check_deposit_amount();
