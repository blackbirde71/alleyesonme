import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from "recharts";
import { useStore } from "../Store";

export default function Chart() {
  const data = useStore((state) => state.boredom);
  const formatYAxis = (value) => {
    if (value < 0.1) {
      return "😴";
    }
    if (value < 0.2) {
      return "🥱";
    }
    if (value < 0.3) {
      return "🫤";
    }
    if (value < 0.4) {
      return "😎";
    }
    return "🤓";
  };
  console.log(data);
  return (
    <div style={{ width: "100%", height: 300 }}>
      <h2 style={{ textAlign: "center" }}>Locked-In Chart</h2>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time">
            <Label value="Time (ms)" offset={-5} position="insideBottom" />
          </XAxis>
          <YAxis dataKey="score" tickFormatter={formatYAxis} tickMargin={10}>
            <Label value="Locked-In Score" angle={-90} position="left" />
          </YAxis>
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="score" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
