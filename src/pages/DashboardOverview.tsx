import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Shield, Bot, Users, Globe } from "lucide-react";
import { format, subDays } from "date-fns";

interface DayData {
  date: string;
  humans: number;
  bots: number;
}

const chartConfig = {
  humans: { label: "人類驗證", color: "hsl(142 71% 45%)" },
  bots: { label: "攔截機器人", color: "hsl(0 84% 60%)" },
};

export default function DashboardOverview() {
  const { user } = useAuth();
  const [data, setData] = useState<DayData[]>([]);
  const [totals, setTotals] = useState({ humans: 0, bots: 0, sites: 0 });
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);

      // Get user's sites
      const { data: sites } = await supabase
        .from("sites")
        .select("id, domain, captcha_type, difficulty")
        .eq("user_id", user.id);

      const siteIds = sites?.map(s => s.id) || [];
      const siteCount = siteIds.length;

      if (siteIds.length === 0) {
        const emptyData = Array.from({ length: 7 }, (_, i) => ({
          date: format(subDays(new Date(), 6 - i), "MM/dd"),
          humans: 0,
          bots: 0,
        }));
        setData(emptyData);
        setTotals({ humans: 0, bots: 0, sites: 0 });
        setLoading(false);
        return;
      }

      // Get last 7 days of logs
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data: logs } = await supabase
        .from("verification_logs")
        .select("*")
        .in("site_id", siteIds)
        .gte("timestamp", sevenDaysAgo)
        .order("timestamp", { ascending: false });

      // Recent logs for table
      setRecentLogs((logs || []).slice(0, 10));

      // Aggregate by day
      const dayMap: Record<string, { humans: number; bots: number }> = {};
      for (let i = 0; i < 7; i++) {
        const dateKey = format(subDays(new Date(), 6 - i), "MM/dd");
        dayMap[dateKey] = { humans: 0, bots: 0 };
      }

      let totalHumans = 0;
      let totalBots = 0;

      logs?.forEach(log => {
        const dateKey = format(new Date(log.timestamp), "MM/dd");
        if (dayMap[dateKey]) {
          if (log.is_human) {
            dayMap[dateKey].humans++;
            totalHumans++;
          } else {
            dayMap[dateKey].bots++;
            totalBots++;
          }
        }
      });

      setTotals({ humans: totalHumans, bots: totalBots, sites: siteCount });
      setData(Object.entries(dayMap).map(([date, vals]) => ({ date, ...vals })));
      setLoading(false);
    };

    fetchData();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">概覽</h1>
        {loading && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-nobot-green/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-nobot-green" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">人類驗證（7天）</p>
                <p className="text-2xl font-bold">{totals.humans}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">攔截機器人（7天）</p>
                <p className="text-2xl font-bold">{totals.bots}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已註冊網站</p>
                <p className="text-2xl font-bold">{totals.sites}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>過去 7 天驗證趨勢</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="humans" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="bots" stroke="hsl(0 84% 60%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Recent logs */}
      {recentLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近驗證記錄</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 text-muted-foreground font-medium">時間</th>
                    <th className="pb-2 text-muted-foreground font-medium">結果</th>
                    <th className="pb-2 text-muted-foreground font-medium">分數</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map(log => (
                    <tr key={log.id} className="border-b border-border/50">
                      <td className="py-2 text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), "MM/dd HH:mm")}
                      </td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          log.is_human ? "bg-nobot-green/10 text-nobot-green" : "bg-destructive/10 text-destructive"
                        }`}>
                          {log.is_human ? "人類" : "機器人"}
                        </span>
                      </td>
                      <td className="py-2 text-xs font-mono">{Number(log.score).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
