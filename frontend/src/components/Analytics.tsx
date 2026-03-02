import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { getAnalytics, AnalyticsData } from "../api";

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#f97316", "#eab308"];

export default function Analytics({ code }: { code: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAnalytics(code)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading analytics...</div>;
  if (!data) return <div className="text-center py-16 text-red-400">URL not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {data.short_url.replace(/^https?:\/\//, "")}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{data.original_url}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-indigo-600">{data.clicks}</p>
            <p className="text-sm text-gray-500">total clicks</p>
          </div>
        </div>
      </div>

      {/* Clicks Over Time */}
      {data.clicks_per_day.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Clicks Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.clicks_per_day}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Browser & Device Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.browsers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Browsers</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.browsers} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {data.browsers.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.devices.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Devices</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.devices} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {data.devices.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* OS & Referrers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.operating_systems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Operating Systems</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.operating_systems}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.referrers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Top Referrers</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.referrers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
