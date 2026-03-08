
-- Reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  display_name text NOT NULL DEFAULT '匿名',
  content text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_review()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  IF length(NEW.content) < 15 THEN
    RAISE EXCEPTION 'Content must be at least 15 characters';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_review_before_insert
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_review();

-- RLS: Anyone can read approved reviews
CREATE POLICY "Anyone can view approved reviews" ON public.reviews FOR SELECT USING (approved = true);

-- RLS: Authenticated users can view own reviews (including unapproved)
CREATE POLICY "Users can view own reviews" ON public.reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- RLS: Authenticated users can insert
CREATE POLICY "Users can insert reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Seed 5 fake reviews (approved)
INSERT INTO public.reviews (user_id, display_name, content, rating, approved) VALUES
  (gen_random_uuid(), 'Alex Chen', '非常好用的驗證系統，整合到我們的電商平台只花了不到10分鐘，效果非常好！推薦給所有人。', 5, true),
  (gen_random_uuid(), 'Sarah Wang', '我們網站之前每天被大量機器人攻擊，使用 NobotCAPTCHA 後幾乎完全解決了這個問題，太感謝了。', 5, true),
  (gen_random_uuid(), 'Mike Liu', '開源免費這點真的太棒了，而且文件寫得很清楚，API 也很簡潔。推薦給所有開發者使用！', 4, true),
  (gen_random_uuid(), 'Emily Zhang', '三種驗證模式可以根據不同場景切換，非常靈活。圖片驗證和文字驗證都很有創意，用戶體驗很好。', 5, true),
  (gen_random_uuid(), 'David Lin', '部署簡單，效果顯著。我們的表單垃圾提交減少了超過百分之九十五，非常滿意這個開源產品。', 4, true);
