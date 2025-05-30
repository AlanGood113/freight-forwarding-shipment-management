"use client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Data = { arrival_date: string; carrier: string; count: number };

export default function ReceivedByCarrierChart() {
  const [data, setData] = useState<Data[]>([]);
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/metrics/received-by-carrier`)
      .then((r) => r.json())
      .then((json) => setData(json.received_by_carrier));
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <XAxis dataKey="arrival_date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" name="Received" />
      </BarChart>
    </ResponsiveContainer>
  );
}
