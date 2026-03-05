import { Navbar } from "@/components/Navbar";
import { NobotWidget } from "@/components/NobotWidget";
import { Shield, Zap, Globe, Lock, Check, ArrowRight, Code, MousePointer, Timer, Activity, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/8 blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] rounded-full bg-nobot-indigo/5 blur-[80px]" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-nobot-green/3 blur-[100px] animate-float" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium mb-6 animate-fade-in">
              <Shield className="w-3.5 h-3.5" />
              開源、免費、隱私優先
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
              比機器人更聰明，
              <br />
              <span className="gradient-text">對人類更友善</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              NobotCAPTCHA 使用行為分析與滑鼠路徑監測，在不打擾用戶的情況下精準識別機器人。
              一行代碼即可部署。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
              <Button asChild size="lg" className="rounded-full px-8 text-base glow-indigo group">
                <Link to="/signup">
                  免費開始使用
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 text-base hover:bg-secondary/50">
                <Link to="/docs">查看文件</Link>
              </Button>
            </div>
          </div>

          {/* Widget Demo */}
          <div className="flex justify-center mb-8 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
            <div className="animate-float">
              <div className="p-1 rounded-lg glow-indigo animate-pulse-glow">
                <NobotWidget demo />
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
            ↑ 點擊試試看 — 這是一個即時互動的 Demo
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 border-t border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-[500px] h-[300px] rounded-full bg-primary/3 blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            運作原理
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-lg mx-auto">
            三層行為分析，讓機器人無所遁形
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: MousePointer,
                step: "01",
                title: "滑鼠軌跡捕捉",
                desc: "SDK 自動記錄用戶的滑鼠移動路徑。人類的移動軌跡帶有微小曲線與不規則性，而機器人通常是絕對直線。",
                color: "text-primary",
              },
              {
                icon: Timer,
                step: "02",
                title: "反應時間分析",
                desc: "測量從頁面載入到用戶點擊的時間間隔。腳本執行速度通常低於 400ms，而人類至少需要 1 秒以上。",
                color: "text-nobot-green",
              },
              {
                icon: Activity,
                step: "03",
                title: "速度變化檢測",
                desc: "分析滑鼠移動的加速與減速模式。人類移動帶有自然的速度變化，機器人則呈現勻速直線運動。",
                color: "text-primary",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className="relative group rounded-xl border border-border/50 bg-card/50 p-6 hover:border-primary/30 hover:bg-card transition-all duration-500 hover:-translate-y-1"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="absolute -top-3 -left-2 text-4xl font-black text-primary/10 select-none">{item.step}</span>
                <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-t border-border/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            為什麼選擇 NobotCAPTCHA？
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-lg mx-auto">
            一個真正為開發者打造的驗證系統
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: Zap,
                title: "行為分析引擎",
                desc: "透過滑鼠軌跡、反應時間與速度變化，精準區分人類與機器人。",
              },
              {
                icon: Lock,
                title: "隱私優先",
                desc: "不追蹤 Cookie、不收集個資。所有分析在瀏覽器端即時完成。",
              },
              {
                icon: Globe,
                title: "一行代碼部署",
                desc: "加入 script 標籤和一個 div，就能在任何網站上運行。",
              },
            ].map((feat, i) => (
              <div
                key={feat.title}
                className="group rounded-xl border border-border/50 bg-card/50 p-6 hover:border-primary/30 hover:bg-card transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <feat.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Preview */}
      <section className="py-24 border-t border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-nobot-green/3 blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-nobot-green/30 bg-nobot-green/5 text-nobot-green text-xs font-medium mb-4">
                <Code className="w-3.5 h-3.5" />
                快速整合
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                三行代碼，<br />即刻保護你的網站
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                只需加入一個 Script 標籤和一個 Div 元素，NobotCAPTCHA 就能自動開始追蹤滑鼠行為並保護你的表單。不需要複雜的設定或第三方帳號。
              </p>
              <ul className="space-y-3 mb-6">
                {["自動初始化，零設定", "支援所有主流瀏覽器", "無框架依賴，純 HTML 即可", "後端驗證 API 回傳分數"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-nobot-green shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link to="/docs">查看完整文件 →</Link>
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xl shadow-primary/5">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-destructive/60" />
                  <span className="w-3 h-3 rounded-full bg-accent/60" style={{ background: 'hsl(45 93% 47% / 0.6)' }} />
                  <span className="w-3 h-3 rounded-full bg-nobot-green/60" />
                </div>
                <span className="text-xs text-muted-foreground font-mono ml-2">index.html</span>
              </div>
              <pre className="p-5 overflow-x-auto text-sm leading-relaxed">
                <code className="font-mono text-foreground/90">{`<!-- 1. 加入 SDK -->
<script src="https://cdn.nobot.io/v1/api.js"
        async defer></script>

<!-- 2. 放入驗證框 -->
<div class="nobot-captcha"
     data-sitekey="YOUR_SITE_KEY">
</div>

<!-- 就這樣！🎉 -->`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto text-center">
            {[
              { value: "< 200ms", label: "驗證延遲" },
              { value: "99.7%", label: "人類通過率" },
              { value: "0", label: "Cookie 追蹤" },
              { value: "∞", label: "免費驗證次數" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 border-t border-border/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            簡單透明的定價
          </h2>
          <p className="text-muted-foreground text-center mb-16">
            永遠免費。沒有隱藏費用。
          </p>

          <div className="max-w-md mx-auto">
            <div className="rounded-2xl border-2 border-primary/40 bg-card p-8 glow-indigo relative overflow-hidden group hover:border-primary/60 transition-all duration-500">
              {/* Animated bg */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-nobot-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Badge */}
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold relative z-10">
                推薦
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-1">Community Plan</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-bold gradient-text">$0</span>
                  <span className="text-muted-foreground text-sm">/ 永遠</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    "無限驗證次數",
                    "完整行為分析引擎",
                    "滑鼠路徑監測",
                    "開源 & 社區支持",
                    "無品牌浮水印",
                    "API 存取",
                    "即時分析儀表板",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <Check className="w-4 h-4 text-nobot-green shrink-0" />
                      <span className="text-foreground/80">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild size="lg" className="w-full rounded-full text-base group/btn">
                  <Link to="/signup">
                    立即開始
                    <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            準備好保護你的網站了嗎？
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            免費註冊，幾分鐘內即可在你的網站上部署 NobotCAPTCHA 人機驗證。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="rounded-full px-8 text-base glow-indigo group">
              <Link to="/signup">
                免費註冊
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 text-base">
              <a href="https://github.com/lan2015se-collab/nobotcaptcha.git" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 w-4 h-4" />
                GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span>NobotCAPTCHA — 開源人機驗證</span>
          </div>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link to="/docs" className="hover:text-foreground transition-colors">文件</Link>
            <a href="https://github.com/lan2015se-collab/nobotcaptcha.git" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
