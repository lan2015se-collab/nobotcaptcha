import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/dashboard");
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
          <h1 className="text-xl font-bold mb-1">登入</h1>
          <p className="text-sm text-muted-foreground mb-6">歡迎回來</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="mt-1" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">密碼</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">忘記密碼？</Link>
              </div>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="mt-1" />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? "登入中..." : "登入"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          還沒有帳號？{" "}
          <Link to="/signup" className="text-primary hover:underline">註冊</Link>
        </p>
      </div>
    </div>
  );
}
