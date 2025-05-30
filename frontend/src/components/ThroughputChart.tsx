"use client";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Point = { arrival_date: string; packages_received: number };

export default function ThroughputChart() {
  const [data, setData] = useState<Point[]>([]);
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/metrics/throughput`)
      .then((r) => r.json())
      .then((json) => setData(json.throughput));
  }, []);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <XAxis dataKey="arrival_date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="packages_received" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}
