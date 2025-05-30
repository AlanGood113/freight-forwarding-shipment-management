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
import { Package, Loader2, AlertTriangle } from "lucide-react"; // Import Lucide icons

type Slice = { mode: string; total_volume: number };

// Define a consistent color palette for your pie chart slices
const COLORS = [
  "#4f46e5", // A vibrant indigo (e.g., for 'Air')
  "#0ea5e9", // A clear sky blue (e.g., for 'Sea')
];

export default function VolumeByModeChart() {
  const [data, setData] = useState<Slice[]>([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData([]); // Clear previous data

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/metrics/volume-by-mode`)
      .then((r) => {
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then((json) => {
        // Ensure data is an array before setting
        if (Array.isArray(json.volume_by_mode)) {
          setData(json.volume_by_mode);
        } else {
          console.warn(
            "API did not return an array for volume_by_mode:",
            json.volume_by_mode
          );
          setData([]);
        }
      })
      .catch((e) => {
        console.error("Failed to fetch volume by mode data:", e);
        setError(`Failed to load chart data: ${e.message || String(e)}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Custom Tooltip for better styling and readability
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-md text-sm">
          <p className="font-semibold text-gray-700">{payload[0].name}</p>
          <p className="text-indigo-600">{`Volume: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 min-h-[400px] flex flex-col">
      {/* Chart Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-purple-100 rounded-full">
          <Package className="h-6 w-6 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Volume by Mode</h2>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-grow flex-col items-center justify-center text-purple-700">
          <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
          <p className="mt-3 text-lg font-medium">Loading Chart Data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-grow flex-col items-center justify-center text-red-700 p-4">
          <AlertTriangle className="h-10 w-10 mb-3 text-red-500" />
          <p className="text-lg font-semibold">Error Loading Chart</p>
          <p className="text-sm mt-1 text-red-600 text-center">{error}</p>
        </div>
      )}

      {/* No Data Available State */}
      {!loading && !error && data.length === 0 && (
        <div className="flex flex-grow flex-col items-center justify-center text-blue-700 p-4">
          <Package className="h-10 w-10 mb-3 text-blue-500" />
          <p className="text-lg font-semibold">No Data Available</p>
          <p className="text-sm mt-1 text-blue-600 text-center">
            No volume by mode data found to display.
          </p>
        </div>
      )}

      {/* Chart Rendering */}
      {!loading && !error && data.length > 0 && (
        <div className="flex-grow flex items-center justify-center">
          {" "}
          {/* Centering content */}
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="total_volume"
                nameKey="mode"
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={60}
                paddingAngle={5}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom" // Position legend below the chart
                align="center" // Center the legend items
                wrapperStyle={{ paddingTop: "20px" }} // Add spacing from the chart
                formatter={(value) => (
                  <span className="text-gray-700 text-sm">{value}</span> // Style legend text
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
