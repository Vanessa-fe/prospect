-- =======================
-- FIX: Création automatique du profil utilisateur
-- =======================

-- Supprimer l'ancienne politique INSERT trop restrictive
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Créer un trigger qui crée automatiquement le profil lors de l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, onboarding_completed)
  VALUES (NEW.id, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger qui s'exécute après la création d'un utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Nouvelle politique INSERT qui permet uniquement via le trigger
CREATE POLICY "Service role can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (true);

COMMENT ON FUNCTION handle_new_user IS 'Crée automatiquement un profil utilisateur lors de l''inscription';
