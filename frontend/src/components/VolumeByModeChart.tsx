"use client";
import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

type Slice = { mode: string; total_volume: number };

export default function VolumeByModeChart() {
  const [data, setData] = useState<Slice[]>([]);
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/metrics/volume-by-mode`)
      .then((r) => r.json())
      .then((json) => setData(json.volume_by_mode));
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total_volume"
          nameKey="mode"
          outerRadius={100}
          label
        >
          {data.map((_, i) => (
            <Cell key={i} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
