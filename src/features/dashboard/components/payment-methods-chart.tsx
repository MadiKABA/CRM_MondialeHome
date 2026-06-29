"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { PaymentMethodStat } from "../types";

const COLORS = [
  "#8B6914",
  "#F97316",
  "#7C3AED",
  "#4A3728",
  "#6B7280",
  "#B8945F",
  "#D97706",
];

interface Props {
  data: PaymentMethodStat[];
}

export function PaymentMethodsChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="border-cream-darker rounded-xl border bg-white p-5">
        <h3 className="text-text-primary mb-4 text-sm font-semibold">
          Modes de paiement
        </h3>
        <div className="text-text-muted flex h-40 items-center justify-center">
          <p className="text-sm">Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-cream-darker rounded-xl border bg-white p-5">
      <h3 className="text-text-primary mb-1 text-sm font-semibold">Modes de paiement</h3>
      <p className="text-text-muted mb-4 text-xs">Répartition des encaissements</p>

      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            dataKey="amount"
            nameKey="methodLabel"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [
              `${value.toLocaleString("fr-FR")} FCFA`,
              "Montant",
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-2 space-y-1.5">
        {data.map((item, index) => (
          <div key={item.method} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-text-secondary text-xs">{item.methodLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-primary text-xs font-medium">
                {item.percentage}%
              </span>
              <span className="text-text-muted text-[10px]">({item.count})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
