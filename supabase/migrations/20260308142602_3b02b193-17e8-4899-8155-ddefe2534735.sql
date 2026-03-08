
CREATE TYPE public.captcha_difficulty AS ENUM ('easy', 'medium', 'hard', 'extreme');

ALTER TABLE public.sites ADD COLUMN difficulty captcha_difficulty NOT NULL DEFAULT 'medium';
