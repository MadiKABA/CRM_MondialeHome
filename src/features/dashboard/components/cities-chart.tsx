"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { MapPin } from "lucide-react";
import type { CityStat } from "../types";

interface Props {
  data: CityStat[];
}

export function CitiesChart({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <div className="border-cream-darker rounded-xl border bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="text-gold-deep size-4" />
        <h3 className="text-text-primary text-sm font-semibold">Clients par ville</h3>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="city"
            tick={{ fontSize: 11, fill: "#888" }}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip formatter={(value: number) => [`${value} clients`, "Nombre"]} />
          <Bar dataKey="clientCount" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? "#8B6914" : "#EEE6D8"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
