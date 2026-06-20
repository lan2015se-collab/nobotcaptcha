-- Add error_email to sites
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS error_email TEXT;

-- One-time passcodes for manual customs clearance
CREATE TABLE IF NOT EXISTS public.manual_passcodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manual_passcodes TO authenticated;
GRANT ALL ON public.manual_passcodes TO service_role;

ALTER TABLE public.manual_passcodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own passcodes"
ON public.manual_passcodes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_manual_passcodes_code ON public.manual_passcodes(code);
CREATE INDEX IF NOT EXISTS idx_manual_passcodes_site ON public.manual_passcodes(site_id);