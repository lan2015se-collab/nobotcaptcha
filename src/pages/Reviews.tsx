import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Star, MessageSquarePlus, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type Review = {
  id: string;
  display_name: string;
  content: string;
  rating: number;
  created_at: string;
};

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              star <= (hover || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-6 hover:border-primary/20 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">{review.display_name}</h3>
          <p className="text-xs text-muted-foreground">
            {new Date(review.created_at).toLocaleDateString("zh-TW")}
          </p>
        </div>
        <StarRating value={review.rating} readonly />
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>
    </div>
  );
}

export default function Reviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [useAnonymous, setUseAnonymous] = useState(false);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, display_name, content, rating, created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
    } else {
      setReviews((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async () => {
    if (!user) return;

    const finalName = useAnonymous ? "匿名" : displayName.trim();
    if (!finalName) {
      toast.error("請輸入暱稱或選擇匿名");
      return;
    }
    if (content.trim().length < 15) {
      toast.error("評價內容至少需要15個字");
      return;
    }
    if (rating < 1 || rating > 5) {
      toast.error("請選擇 1-5 星評分");
      return;
    }

    setSubmitting(true);

    try {
      // Call moderation edge function
      const { data: modResult, error: modError } = await supabase.functions.invoke("moderate-review", {
        body: { content: content.trim(), display_name: finalName, rating },
      });

      if (modError) {
        toast.error("審核服務錯誤，請稍後再試");
        setSubmitting(false);
        return;
      }

      if (!modResult.approved) {
        toast.error(`審核未通過：${modResult.reason}`);
        setSubmitting(false);
        return;
      }

      // Insert review
      const { error: insertError } = await supabase.from("reviews").insert({
        user_id: user.id,
        display_name: finalName,
        content: content.trim(),
        rating,
        approved: true,
      } as any);

      if (insertError) {
        toast.error(insertError.message);
        setSubmitting(false);
        return;
      }

      toast.success("評價已發佈！感謝您的回饋");
      setDialogOpen(false);
      setContent("");
      setDisplayName("");
      setRating(5);
      setUseAnonymous(false);
      fetchReviews();
    } catch (e) {
      toast.error("提交失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">客戶評價</h1>
            <p className="text-muted-foreground">
              看看其他開發者怎麼說 NobotCAPTCHA
            </p>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <StarRating value={Math.round(Number(avgRating))} readonly />
                <span className="text-sm text-muted-foreground">
                  {avgRating} / 5 · {reviews.length} 則評價
                </span>
              </div>
            )}
          </div>

          {/* Action button - top left area aligned */}
          <div>
            {user ? (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full gap-2">
                    <MessageSquarePlus className="w-4 h-4" />
                    Feedback
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>撰寫評價</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label>暱稱</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="輸入你的暱稱"
                          disabled={useAnonymous}
                          className={useAnonymous ? "opacity-50" : ""}
                        />
                        <label className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useAnonymous}
                            onChange={(e) => setUseAnonymous(e.target.checked)}
                            className="rounded border-border"
                          />
                          匿名
                        </label>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <Label>評價內容 <span className="text-xs text-muted-foreground">（至少 15 字）</span></Label>
                      <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="分享你使用 NobotCAPTCHA 的體驗..."
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {content.length} / 15 字
                      </p>
                    </div>

                    {/* Rating */}
                    <div className="space-y-2">
                      <Label>星評</Label>
                      <StarRating value={rating} onChange={setRating} />
                    </div>

                    {/* Submit */}
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || content.trim().length < 15}
                      className="w-full"
                    >
                      {submitting ? "審核中..." : "提交"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      提交後將由 AI 審核內容是否適當
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button asChild variant="outline" className="rounded-full gap-2">
                <Link to="/login">
                  <LogIn className="w-4 h-4" />
                  登入即可評論
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Reviews grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card/50 p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                <div className="h-3 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>還沒有評價</p>
            <p className="text-sm">成為第一個分享使用心得的人！</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
