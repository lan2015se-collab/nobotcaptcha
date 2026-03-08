import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, MessageSquarePlus, Shield } from "lucide-react";
import { toast } from "sonner";

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
    <div className="rounded-xl border border-border/50 bg-card/50 p-5 hover:border-primary/20 transition-all duration-300">
      <div className="flex items-start justify-between mb-2">
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

export default function DashboardReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [useAnonymous, setUseAnonymous] = useState(false);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("id, display_name, content, rating, created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false });
    setReviews((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleSubmit = async () => {
    if (!user) return;
    const finalName = useAnonymous ? "匿名" : displayName.trim();
    if (!finalName) { toast.error("請輸入暱稱或選擇匿名"); return; }
    if (content.trim().length < 15) { toast.error("評價內容至少需要15個字"); return; }

    setSubmitting(true);
    try {
      const { data: modResult, error: modError } = await supabase.functions.invoke("moderate-review", {
        body: { content: content.trim(), display_name: finalName, rating },
      });
      if (modError) { toast.error("審核服務錯誤"); setSubmitting(false); return; }
      if (!modResult.approved) { toast.error(`審核未通過：${modResult.reason}`); setSubmitting(false); return; }

      const { error: insertError } = await supabase.from("reviews").insert({
        user_id: user.id, display_name: finalName, content: content.trim(), rating, approved: true,
      } as any);
      if (insertError) { toast.error(insertError.message); setSubmitting(false); return; }

      toast.success("評價已發佈！");
      setDialogOpen(false);
      setContent(""); setDisplayName(""); setRating(5); setUseAnonymous(false);
      fetchReviews();
    } catch { toast.error("提交失敗"); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">客戶評價</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full gap-2">
              <MessageSquarePlus className="w-4 h-4" />
              Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>撰寫評價</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>暱稱</Label>
                <div className="flex items-center gap-3">
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="輸入暱稱" disabled={useAnonymous} className={useAnonymous ? "opacity-50" : ""} />
                  <label className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap cursor-pointer">
                    <input type="checkbox" checked={useAnonymous} onChange={(e) => setUseAnonymous(e.target.checked)} className="rounded border-border" />
                    匿名
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>評價內容 <span className="text-xs text-muted-foreground">（至少 15 字）</span></Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="分享你的體驗..." rows={4} />
                <p className="text-xs text-muted-foreground text-right">{content.length} / 15 字</p>
              </div>
              <div className="space-y-2">
                <Label>星評</Label>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <Button onClick={handleSubmit} disabled={submitting || content.trim().length < 15} className="w-full">
                {submitting ? "審核中..." : "提交"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">提交後將由 AI 審核內容</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card/50 p-5 animate-pulse">
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
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
