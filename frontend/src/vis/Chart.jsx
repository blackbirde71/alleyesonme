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
  Label
} from "recharts";
import { useStore } from "../Store";

export default function Chart() {
  const data = useStore((state) => state.boredom);
  console.log(data);
  return (
    <div style={{ width: '100%', height: 300 }}>
      <h2 style={{ textAlign: 'center' }}>Boredom Over Time</h2>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time">
            <Label value="Time (s)" offset={-5} position="insideBottom" />
          </XAxis>
          <YAxis dataKey="score">
            <Label value="Boredom Score" angle={-90} position="insideLeft" />
          </YAxis>
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="score" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}