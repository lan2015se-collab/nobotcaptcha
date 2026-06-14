
-- telegram_users
CREATE TABLE public.telegram_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id bigint NOT NULL UNIQUE,
  login_id text NOT NULL UNIQUE,
  linked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  linked_at timestamptz
);
CREATE INDEX idx_telegram_users_login_id ON public.telegram_users(login_id);
CREATE INDEX idx_telegram_users_user_id ON public.telegram_users(user_id);

GRANT SELECT ON public.telegram_users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_users TO authenticated;
GRANT ALL ON public.telegram_users TO service_role;

ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view by login_id" ON public.telegram_users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can update own telegram link" ON public.telegram_users FOR UPDATE TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);

-- changelog
CREATE TABLE public.changelog (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_changelog_created_at ON public.changelog(created_at DESC);

GRANT SELECT ON public.changelog TO anon, authenticated;
GRANT ALL ON public.changelog TO service_role;

ALTER TABLE public.changelog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published changelog" ON public.changelog FOR SELECT TO anon, authenticated USING (published = true);

CREATE TRIGGER update_changelog_updated_at BEFORE UPDATE ON public.changelog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
