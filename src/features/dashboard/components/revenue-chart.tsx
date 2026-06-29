"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { RevenueChartData } from "../types";

interface Props {
  data: RevenueChartData;
}

interface ChartPoint {
  label: string;
  revenue: number;
  salesCount: number;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload as ChartPoint | undefined;

  return (
    <div className="border-cream-darker rounded-xl border bg-white p-3 text-sm shadow-lg">
      <p className="text-text-primary mb-1 font-semibold">{label}</p>
      <p className="text-gold-deep font-bold">
        {(payload[0]?.value ?? 0).toLocaleString("fr-FR")} FCFA
      </p>
      <p className="text-text-muted text-xs">{point?.salesCount ?? 0} vente(s)</p>
    </div>
  );
}

export function RevenueChart({ data }: Props) {
  const chartData: ChartPoint[] = data.points.map((p) => ({
    label: p.label,
    revenue: p.revenue,
    salesCount: p.salesCount,
  }));

  const formatYAxis = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
    return String(value);
  };

  return (
    <div className="border-cream-darker rounded-xl border bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-text-primary text-sm font-semibold">
            Chiffre d&apos;affaires
          </h3>
          <p className="text-text-muted mt-0.5 text-xs">
            Total : {data.total.toLocaleString("fr-FR")} FCFA
          </p>
        </div>
        <span className="text-text-muted bg-cream border-cream-darker rounded-full border px-2 py-1 text-[10px]">
          {data.granularity === "day"
            ? "Par jour"
            : data.granularity === "week"
              ? "Par semaine"
              : "Par mois"}
        </span>
      </div>

      {chartData.length === 0 ? (
        <div className="text-text-muted flex h-52 items-center justify-center">
          <p className="text-sm">Aucune vente sur cette période</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B6914" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8B6914" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEE6D8" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#888" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 11, fill: "#888" }}
              tickLine={false}
              axisLine={false}
              width={45}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "#8B6914", strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#8B6914"
              strokeWidth={2.5}
              fill="url(#goldGradient)"
              dot={false}
              activeDot={{ r: 5, fill: "#8B6914", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
