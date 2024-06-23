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
} from "recharts";
import { useStore } from "../Store";

export default function Chart() {
  const data = useStore((state) => state.boredom);
  console.log(data);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        width={500}
        height={300}
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis dataKey="score" />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="score" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
}
