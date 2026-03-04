
-- Drop the permissive policy
DROP POLICY "Anyone can insert verification logs" ON public.verification_logs;

-- Create a more restrictive policy: only allow insert if site_id references a valid site
CREATE POLICY "Insert logs for valid sites" ON public.verification_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.sites WHERE sites.id = verification_logs.site_id)
);
