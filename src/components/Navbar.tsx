import { Link } from "react-router-dom";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <Shield className="w-7 h-7 text-primary group-hover:text-nobot-indigo-glow transition-colors" />
          <span className="text-lg font-bold tracking-tight">NobotCAPTCHA</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            文件
          </Link>
          <Link to="/reviews" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            評價
          </Link>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            登入
          </Link>
          <Button asChild size="sm" className="rounded-full px-5">
            <Link to="/signup">免費開始</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-4 py-4 flex flex-col gap-3">
          <Link to="/docs" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>文件</Link>
          <Link to="/reviews" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>評價</Link>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>登入</Link>
          <Button asChild size="sm" className="rounded-full w-fit">
            <Link to="/signup" onClick={() => setOpen(false)}>免費開始</Link>
          </Button>
        </div>
      )}
    </nav>
  );
}
