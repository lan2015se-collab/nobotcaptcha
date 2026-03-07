
-- Add captcha_type enum
CREATE TYPE public.captcha_type AS ENUM ('checkbox', 'image', 'text');

-- Add captcha_type column to sites
ALTER TABLE public.sites ADD COLUMN captcha_type public.captcha_type NOT NULL DEFAULT 'checkbox';
