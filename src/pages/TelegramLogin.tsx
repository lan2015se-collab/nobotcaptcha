import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { toast } from "sonner";

export default function TelegramLogin() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const telegramId = params.get("id") || "";

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkOk, setLinkOk] = useState(false);
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!telegramId) { setValid(false); return; }
    supabase.from("telegram_users").select("id").eq("login_id", telegramId).maybeSingle()
      .then(({ data }) => setValid(!!data));
  }, [telegramId]);

  useEffect(() => {
    const doLink = async () => {
      if (!user || !session || !telegramId || linkOk) return;
      const { data, error } = await supabase.functions.invoke("telegram-link", {
        body: { loginId: telegramId },
      });
      if (error || !data?.ok) {
        toast.error(error?.message || data?.error || "綁定失敗");
        return;
      }
      setLinkOk(true);
    };
    doLink();
  }, [user, session, telegramId, linkOk]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/telegram/login?id=${telegramId}` },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Account created");
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin + `/telegram/login?id=${telegramId}`,
    });
    if (result.error) toast.error(result.error.message || "登入失敗");
  };

  if (valid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="p-6 max-w-sm w-full text-center">
          <h1 className="text-lg font-bold mb-2">Invalid Telegram ID</h1>
          <p className="text-sm text-muted-foreground">Please use the link sent by the NobotCAPTCHA bot.</p>
        </Card>
      </div>
    );
  }

  if (linkOk) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="p-8 max-w-md w-full text-center space-y-3">
          <Shield className="w-10 h-10 mx-auto text-primary" />
          <h1 className="text-xl font-bold">Thank you for login</h1>
          <p className="text-muted-foreground">Now you can close your browser</p>
          <p className="text-muted-foreground">And go back to Telegram</p>
          <Button variant="outline" className="mt-2" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <Shield className="w-7 h-7 text-primary" />
          <span className="text-lg font-bold">NobotCAPTCHA</span>
        </Link>

        <Card className="p-5">
          <div className="mb-4 p-3 rounded-md bg-primary/5 border border-primary/20 text-center">
            <p className="text-xs text-muted-foreground">Your Telegram ID</p>
            <p className="text-lg font-mono font-bold tracking-wider">{telegramId}</p>
          </div>

          <div className="flex gap-2 mb-4 text-sm">
            <button onClick={() => setTab("login")}
              className={`flex-1 py-2 rounded ${tab === "login" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              登入
            </button>
            <button onClick={() => setTab("signup")}
              className={`flex-1 py-2 rounded ${tab === "signup" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              註冊
            </button>
          </div>

          <div className="space-y-2 mb-3">
            <Button variant="outline" className="w-full" onClick={() => handleOAuth("google")}>使用 Google</Button>
            <Button variant="outline" className="w-full" onClick={() => handleOAuth("apple")}>使用 Apple</Button>
          </div>

          <form onSubmit={tab === "login" ? handleLogin : handleSignup} className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>密碼</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "..." : tab === "login" ? "登入" : "註冊"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
