import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold">NobotCAPTCHA</span>
        </Link>

        <div className="rounded-xl border border-border bg-card p-6">
          {sent ? (
            <div className="text-center">
              <h1 className="text-xl font-bold mb-2">已發送</h1>
              <p className="text-sm text-muted-foreground">請查看 Email 中的重設密碼連結。</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold mb-1">忘記密碼</h1>
              <p className="text-sm text-muted-foreground mb-6">輸入 Email 以重設密碼</p>
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="mt-1" />
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={loading}>
                  {loading ? "發送中..." : "發送重設連結"}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link to="/login" className="text-primary hover:underline">返回登入</Link>
        </p>
      </div>
    </div>
  );
}
