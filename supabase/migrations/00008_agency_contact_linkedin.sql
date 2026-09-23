-- =======================
-- AGENCIES : lien LinkedIn du contact
-- =======================
-- Ajouté pour l'enrichissement de contact (Hunter.io) : le profil LinkedIn
-- trouvé pour le CTO/Tech Lead d'une agence est distinct de contact_email/
-- contact_phone, donc sa propre colonne plutôt que de le glisser dans notes.
ALTER TABLE agencies ADD COLUMN contact_linkedin_url TEXT;

COMMENT ON COLUMN agencies.contact_linkedin_url IS 'URL du profil LinkedIn du contact, trouvée manuellement ou via enrichissement (Hunter.io)';
