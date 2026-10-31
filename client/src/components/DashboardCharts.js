
import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import "./DashboardCharts.css";

const data = [
  { month: "May", revenue: 12000 },
  { month: "Jun", revenue: 18000 },
  { month: "Jul", revenue: 15000 },
  { month: "Aug", revenue: 25000 },
  { month: "Sep", revenue: 22000 },
  { month: "Oct", revenue: 32000 },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="premium-tooltip">
      <span>{label} 2026</span>
      <h3>₹{payload[0].value.toLocaleString("en-IN")}</h3>
      <small>Collected Revenue</small>
    </div>
  );
}

function DashboardCharts() {
  return (
    <div className="premium-chart-card">

      <div className="premium-chart-header">
        <div>
          <span className="chart-eyebrow">PERFORMANCE</span>
          <h3>Revenue Analytics</h3>
          <p>Track your subscription revenue over time</p>
        </div>

        <select defaultValue="6">
          <option value="6">Last 6 Months</option>
          <option value="3">Last 3 Months</option>
          <option value="12">Last 12 Months</option>
        </select>
      </div>

      <div className="revenue-highlight">
        <h2>₹32,000</h2>
        <span>October Revenue</span>
      </div>

      <div className="premium-chart">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="premiumGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#818cf8"
                  stopOpacity={0.65}
                />
                <stop
                  offset="55%"
                  stopColor="#6366f1"
                  stopOpacity={0.22}
                />
                <stop
                  offset="100%"
                  stopColor="#6366f1"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#334155"
              strokeDasharray="4 5"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              dy={12}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(value) => `₹${value / 1000}k`}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#818cf8"
              strokeWidth={3}
              fill="url(#premiumGradient)"
              dot={false}
              activeDot={{
                r: 6,
                fill: "#a5b4fc",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-footer">
        <span>
          <span className="footer-dot"></span>
          Monthly collected revenue
        </span>
        <span>Demo data</span>
      </div>

    </div>
  );
}

export default DashboardCharts;
