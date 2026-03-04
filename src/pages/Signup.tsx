import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { toast } from "sonner";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("密碼至少需要 6 個字元");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("註冊成功！請查看 Email 確認帳號。");
      navigate("/login");
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
          <h1 className="text-xl font-bold mb-1">建立帳號</h1>
          <p className="text-sm text-muted-foreground mb-6">免費開始使用 NobotCAPTCHA</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="name">名稱</Label>
              <Input id="name" value={displayName} onChange={e => setDisplayName(e.target.value)} required placeholder="你的名稱" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">密碼</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="至少 6 個字元" className="mt-1" />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? "建立中..." : "建立帳號"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          已有帳號？{" "}
          <Link to="/login" className="text-primary hover:underline">登入</Link>
        </p>
      </div>
    </div>
  );
}
