import { Navbar } from "@/components/Navbar";
import { NobotWidget } from "@/components/NobotWidget";
import { Shield, Zap, Globe, Lock, Check, ArrowRight, Code, MousePointer, Timer, Activity, Github, Fingerprint, Cookie, Brain, Server, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";

const Index = () => {
  const [demoType, setDemoType] = useState<"checkbox" | "image" | "text">("checkbox");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/8 blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] rounded-full bg-nobot-indigo/5 blur-[80px]" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-nobot-green/3 blur-[100px] animate-float" />
        </div>

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
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-4 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              NobotCAPTCHA 結合行為分析、瀏覽器指紋、Cookie 驗證和 AI 風險評估，多維度精準識別機器人。支援勾選、圖片、扭曲文字三種驗證模式。
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-8 animate-fade-in" style={{ animationDelay: '0.25s', animationFillMode: 'both' }}>
              {[
                { icon: MousePointer, text: "行為分析" },
                { icon: Fingerprint, text: "瀏覽器指紋" },
                { icon: Cookie, text: "Cookie 檢測" },
                { icon: Brain, text: "AI 風險評估" },
                { icon: Server, text: "IP 信譽" },
              ].map(tag => (
                <span key={tag.text} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 text-xs text-muted-foreground border border-border/50">
                  <tag.icon className="w-3 h-3 text-primary" />
                  {tag.text}
                </span>
              ))}
            </div>
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
          <div className="flex justify-center mb-4 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
            <div className="animate-float">
              <div className="p-1 rounded-lg glow-indigo animate-pulse-glow">
                <NobotWidget demo />
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mb-2 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
            ↑ 點擊試試看 — 這是一個即時互動的 Demo
          </p>

          {/* Captcha type demo tabs */}
          <div className="flex justify-center gap-2 mt-6 animate-fade-in" style={{ animationDelay: '0.55s', animationFillMode: 'both' }}>
            {[
              { type: "checkbox" as const, label: "✅ 勾選驗證" },
              { type: "image" as const, label: "🖼️ 圖片驗證" },
              { type: "text" as const, label: "🔤 文字驗證" },
            ].map(t => (
              <button
                key={t.type}
                onClick={() => setDemoType(t.type)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  demoType === t.type
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-center text-[10px] text-muted-foreground/60 mt-2">
            在控制台中可自由切換每個網站的驗證類型
          </p>
        </div>
      </section>

      {/* Multi-layer security */}
      <section className="py-24 border-t border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-[500px] h-[300px] rounded-full bg-primary/3 blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            六層安全防護
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-lg mx-auto">
            不只是行為分析 — 我們用多維度數據精準判斷每一次請求
          </p>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {[
              { icon: MousePointer, title: "行為分析", desc: "滑鼠軌跡曲線、速度變化", color: "text-primary" },
              { icon: Cookie, title: "Cookie", desc: "驗證瀏覽器 Cookie 能力", color: "text-nobot-green" },
              { icon: Fingerprint, title: "瀏覽器指紋", desc: "Canvas、WebGL、插件特徵", color: "text-primary" },
              { icon: Server, title: "IP 信譽", desc: "追蹤 IP 失敗歷史與頻率", color: "text-nobot-green" },
              { icon: Eye, title: "帳號歷史", desc: "記錄驗證行為模式", color: "text-primary" },
              { icon: Brain, title: "AI 風險分析", desc: "綜合評分多維度加權", color: "text-nobot-green" },
            ].map((item, i) => (
              <div
                key={item.title}
                className="group rounded-xl border border-border/50 bg-card/50 p-4 hover:border-primary/30 hover:bg-card transition-all duration-500 hover:-translate-y-1 text-center"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 mx-auto group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Captcha types */}
      <section className="py-24 border-t border-border/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            三種驗證模式
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-lg mx-auto">
            根據你的需求選擇最適合的驗證方式，一個控制台統一管理
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                emoji: "✅",
                title: "一般勾選驗證",
                desc: "最簡潔的驗證體驗。用戶只需點擊勾選框，背景自動完成行為分析和指紋驗證。適合大多數場景。",
                features: ["一鍵完成驗證", "背景行為分析", "最少用戶打擾"],
              },
              {
                emoji: "🖼️",
                title: "圖片驗證",
                desc: "類似 reCAPTCHA 的圖片選擇驗證。顯示 3×3 圖案網格，要求用戶選出指定類別的所有圖案。每次題目隨機生成，絕不重複。",
                features: ["隨機圖案組合", "每次挑戰獨一無二", "防截圖重播攻擊"],
              },
              {
                emoji: "🔤",
                title: "扭曲文字驗證",
                desc: "經典的文字辨識驗證。使用 Canvas 即時渲染扭曲文字，包含隨機旋轉、縮放、噪音線和干擾點。每次文字完全不同。",
                features: ["Canvas 即時渲染", "多重扭曲效果", "每次隨機生成新文字"],
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-border/50 bg-card/50 p-8 hover:border-primary/30 hover:bg-card transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5"
              >
                <span className="text-4xl mb-4 block">{item.emoji}</span>
                <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.desc}</p>
                <ul className="space-y-2">
                  {item.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-nobot-green shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 border-t border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 right-0 w-[500px] h-[300px] rounded-full bg-nobot-green/3 blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            運作原理
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-lg mx-auto">
            從前端採集到後端驗證，完整保護鏈
          </p>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { step: "01", title: "載入 SDK", desc: "一行 Script 標籤自動初始化行為監測引擎", icon: Code },
              { step: "02", title: "採集數據", desc: "追蹤滑鼠軌跡、鍵盤節奏、Cookie、瀏覽器指紋", icon: Fingerprint },
              { step: "03", title: "前端驗證", desc: "用戶完成勾選 / 圖片 / 文字挑戰，生成加密 Token", icon: Shield },
              { step: "04", title: "後端評分", desc: "API 綜合 6 項指標回傳 AI 風險評分", icon: Brain },
            ].map((item, i) => (
              <div
                key={item.step}
                className="relative group rounded-xl border border-border/50 bg-card/50 p-6 hover:border-primary/30 hover:bg-card transition-all duration-500 hover:-translate-y-1"
              >
                <span className="absolute -top-3 -left-2 text-4xl font-black text-primary/10 select-none">{item.step}</span>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 text-primary/20">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
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
                兩行代碼，<br />即刻保護你的網站
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                只需一個 Script 和一個 Div，NobotCAPTCHA 就會自動渲染驗證框並開始保護你的表單。
              </p>
              <ul className="space-y-3 mb-6">
                {["自動初始化，零設定", "支援所有主流瀏覽器", "三種驗證模式可選", "後端 API 回傳多維度評分"].map(item => (
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
                  <span className="w-3 h-3 rounded-full" style={{ background: 'hsl(45 93% 47% / 0.6)' }} />
                  <span className="w-3 h-3 rounded-full bg-nobot-green/60" />
                </div>
                <span className="text-xs text-muted-foreground font-mono ml-2">index.html</span>
              </div>
              <pre className="p-5 overflow-x-auto text-sm leading-relaxed">
                <code className="font-mono text-foreground/90">{`<!-- 1. 加入 SDK -->
<script src=".../functions/v1/sdk"
        async defer></script>

<!-- 2. 放入驗證框 -->
<div class="nobot-captcha"
     data-sitekey="YOUR_SITE_KEY"
     data-type="checkbox">
</div>

<!-- 就這樣！🎉 -->`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* API Response Preview */}
      <section className="py-24 border-t border-border/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            豐富的 API 回應
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
            後端驗證 API 回傳多維度安全評分，讓你精確控制風險閾值
          </p>

          <div className="max-w-2xl mx-auto rounded-xl border border-border bg-card overflow-hidden shadow-xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
              <span className="text-xs text-muted-foreground font-mono">POST /functions/v1/siteverify — Response</span>
            </div>
            <pre className="p-5 overflow-x-auto text-sm leading-relaxed">
              <code className="font-mono text-foreground/90">{`{
  "success": true,
  "score": 0.92,
  "challenge_ts": "2026-03-07T10:30:00Z",
  "hostname": "example.com",
  "checks": {
    "behavior": 0.90,
    "ip_reputation": 1.00,
    "fingerprint": 0.95,
    "cookie": true
  }
}`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto text-center">
            {[
              { value: "6 層", label: "安全防護" },
              { value: "3 種", label: "驗證模式" },
              { value: "< 200ms", label: "驗證延遲" },
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
              { icon: Zap, title: "多維度分析", desc: "不只看行為，同時分析指紋、Cookie、IP 信譽和鍵盤模式，形成綜合風險評分。" },
              { icon: Lock, title: "隱私優先", desc: "所有指紋資料只用於驗證，不追蹤用戶。前端分析即時完成，不上傳原始數據。" },
              { icon: Globe, title: "兩行代碼部署", desc: "一個 Script 加一個 Div，支援 checkbox / image / text 三種模式切換。" },
            ].map((feat) => (
              <div
                key={feat.title}
                className="group rounded-xl border border-border/50 bg-card/50 p-6 hover:border-primary/30 hover:bg-card transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
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
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-nobot-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold relative z-10">推薦</div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-1">Community Plan</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-bold gradient-text">$0</span>
                  <span className="text-muted-foreground text-sm">/ 永遠</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    "無限驗證次數",
                    "六層安全防護",
                    "三種驗證模式",
                    "多維度 AI 評分",
                    "即時分析儀表板",
                    "開源 & 社區支持",
                    "API 存取",
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
            免費註冊，幾分鐘內即可部署三種驗證模式保護你的網站。
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
