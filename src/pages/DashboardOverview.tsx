import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Shield, Bot, Users } from "lucide-react";
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

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Get user's sites
      const { data: sites } = await supabase
        .from("sites")
        .select("id")
        .eq("user_id", user.id);

      const siteIds = sites?.map(s => s.id) || [];
      setTotals(prev => ({ ...prev, sites: siteIds.length }));

      if (siteIds.length === 0) {
        // Generate empty 7-day data
        const emptyData = Array.from({ length: 7 }, (_, i) => ({
          date: format(subDays(new Date(), 6 - i), "MM/dd"),
          humans: 0,
          bots: 0,
        }));
        setData(emptyData);
        return;
      }

      // Get last 7 days of logs
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data: logs } = await supabase
        .from("verification_logs")
        .select("*")
        .in("site_id", siteIds)
        .gte("timestamp", sevenDaysAgo);

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

      setTotals(prev => ({ ...prev, humans: totalHumans, bots: totalBots }));
      setData(Object.entries(dayMap).map(([date, vals]) => ({ date, ...vals })));
    };

    fetchData();
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">概覽</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-nobot-green/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-nobot-green" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">人類驗證</p>
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
                <p className="text-sm text-muted-foreground">攔截機器人</p>
                <p className="text-2xl font-bold">{totals.bots}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
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
    </div>
  );
}
