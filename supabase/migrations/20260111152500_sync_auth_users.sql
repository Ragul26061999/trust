-- Trigger to sync auth.users to public.login table
-- This ensures that when a user signs up via Google (or any other method),
-- a record is created in your 'login' table automatically.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.login (id, email, username, password_hash)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'OAUTH_USER' -- Placeholder since password isn't used for Google login
  )
  ON CONFLICT (email) DO UPDATE
  SET updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
