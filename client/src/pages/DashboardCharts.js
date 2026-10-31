
import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import "./DashboardCharts.css";

const chartData = [
  { month: "May", revenue: 12000 },
  { month: "Jun", revenue: 18000 },
  { month: "Jul", revenue: 15000 },
  { month: "Aug", revenue: 25000 },
  { month: "Sep", revenue: 22000 },
  { month: "Oct", revenue: 32000 },
];

function DashboardCharts() {
  return (
    <div className="dashboard-chart-card">
      <div className="chart-header">
        <div>
          <h3>Revenue Overview</h3>
          <p>Monthly revenue performance</p>
        </div>
        <span className="chart-period">Last 6 Months</span>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 15, right: 15, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#766cff" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#766cff" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#edf0f5"
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#929baa", fontSize: 12 }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#929baa", fontSize: 12 }}
              tickFormatter={(value) => `₹${value / 1000}k`}
            />

            <Tooltip
              formatter={(value) => [
                `₹${value.toLocaleString("en-IN")}`,
                "Revenue",
              ]}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#766cff"
              strokeWidth={3}
              fill="url(#revenueGradient)"
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default DashboardCharts;
