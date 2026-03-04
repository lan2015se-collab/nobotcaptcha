import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      // Not a valid recovery link
    }
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("密碼至少需要 6 個字元");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("密碼已更新！");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold">NobotCAPTCHA</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h1 className="text-xl font-bold mb-1">設定新密碼</h1>
          <p className="text-sm text-muted-foreground mb-6">請輸入新密碼</p>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="password">新密碼</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="至少 6 個字元" className="mt-1" />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? "更新中..." : "更新密碼"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
