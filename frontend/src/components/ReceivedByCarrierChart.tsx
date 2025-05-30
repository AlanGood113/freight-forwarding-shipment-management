"use client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Truck, Loader2, AlertTriangle, CalendarDays } from "lucide-react";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Styles for the date picker

// Ensure you have Tailwind CSS configured in your project.
// If the DatePicker looks unstyled, you might need to
// add utility classes to its components or use a library
// that provides Tailwind-compatible date pickers.
// For now, we rely on the default react-datepicker styles.

type DailyCarrierData = { carrier: string; count: number };
type ApiResponse = {
  received_by_carrier: DailyCarrierData[];
};

const COLORS = [
  "#4f46e5", // indigo-600
  "#0ea5e9", // sky-500
  "#10b981", // emerald-500
  "#f97316", // orange-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#64748b", // slate-500
];

export default function ReceivedByCarrierChart() {
  const [data, setData] = useState<DailyCarrierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State to manage the current date for data fetching
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Initialize with today's date

  // Format date to YYYY-MM-DD for API calls
  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Effect to fetch data whenever selectedDate changes
  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError(null);
      setData([]); // Clear previous data

      const formattedDate = formatDateToYYYYMMDD(selectedDate);
      const url = `${process.env.NEXT_PUBLIC_API_URL}/metrics/received-by-carrier?start_date=${formattedDate}&end_date=${formattedDate}`;

      try {
        const r = await fetch(url);
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        const json: ApiResponse = await r.json();
        if (Array.isArray(json.received_by_carrier)) {
          setData(json.received_by_carrier);
        } else {
          console.warn(
            "API returned invalid data format:",
            json.received_by_carrier
          );
          setData([]);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        console.error("Failed to fetch received by carrier data:", e);
        setError(
          `Failed to load chart data for ${formattedDate}: ${e.message}`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [selectedDate]); // Dependency array: re-run effect when selectedDate changes

  // Custom Tooltip Component for better UI
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-md text-sm">
          <p className="font-semibold text-gray-700">{`Carrier: ${label}`}</p>
          <p className="text-indigo-600">{`Received: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 min-h-[400px] flex flex-col">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Truck className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">
            Received By Carrier
          </h2>
        </div>

        {/* Date Picker Control */}
        <div className="flex items-center space-x-2">
          <CalendarDays className="h-5 w-5 text-gray-600" />
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) =>
              setSelectedDate(date ? date : new Date())
            }
            dateFormat="yyyy-MM-dd"
            maxDate={new Date()} // Prevent selecting future dates
            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-gray-700 cursor-pointer"
            popperPlacement="bottom-end" // Adjust placement if needed
            // You can add more props for customization, e.g., showMonthDropdown, showYearDropdown
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-grow flex-col items-center justify-center text-blue-700">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
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
        <div className="flex flex-grow flex-col items-center justify-center text-gray-700 p-4">
          <Truck className="h-10 w-10 mb-3 text-gray-500" />
          <p className="text-lg font-semibold">No Data Available</p>
          <p className="text-sm mt-1 text-gray-600 text-center">
            No received data found for carriers on this date.
          </p>
        </div>
      )}

      {/* Chart Rendering */}
      {!loading && !error && data.length > 0 && (
        <div className="h-72">
          {" "}
          {/* Fixed height for chart area */}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />
              <XAxis
                dataKey="carrier"
                stroke="#6b7280"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#6b7280"
                label={{
                  value: "Count",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#6b7280",
                }}
              />
              <Tooltip
                cursor={{ fill: "#e0e7ff", opacity: 0.6 }}
                content={<CustomTooltip />}
              />
              <Bar dataKey="count" name="Received" fill="#4f46e5" barSize={30}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
