import { Navbar } from "@/components/Navbar";
import { NobotWidget } from "@/components/NobotWidget";
import { Shield, Zap, Globe, Lock, Check, ArrowRight } from "lucide-react";
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
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] rounded-full bg-nobot-indigo/5 blur-[80px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium mb-6">
              <Shield className="w-3.5 h-3.5" />
              開源、免費、隱私優先
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
              比機器人更聰明，
              <br />
              <span className="gradient-text">對人類更友善</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              NobotCAPTCHA 使用行為分析與滑鼠路徑監測，在不打擾用戶的情況下精準識別機器人。
              一行代碼即可部署。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="rounded-full px-8 text-base glow-indigo">
                <Link to="/signup">
                  免費開始使用
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 text-base">
                <Link to="/docs">查看文件</Link>
              </Button>
            </div>
          </div>

          {/* Widget Demo */}
          <div className="flex justify-center mb-8">
            <div className="animate-float">
              <div className="p-1 rounded-lg glow-indigo animate-pulse-glow">
                <NobotWidget demo />
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            ↑ 點擊試試看 — 這是一個即時互動的 Demo
          </p>
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
            ].map((feat) => (
              <div
                key={feat.title}
                className="group rounded-xl border border-border/50 bg-card/50 p-6 hover:border-primary/30 hover:bg-card transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
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
            <div className="rounded-2xl border-2 border-primary/40 bg-card p-8 glow-indigo relative overflow-hidden">
              {/* Badge */}
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                推薦
              </div>

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
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-nobot-green shrink-0" />
                    <span className="text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>

              <Button asChild size="lg" className="w-full rounded-full text-base">
                <Link to="/signup">立即開始</Link>
              </Button>
            </div>
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
