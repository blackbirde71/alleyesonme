import React, { useEffect, useState } from "react";
import {
  LineChart,
  PieChart,
  Pie,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
  Cell,
} from "recharts";
import { useStore } from "../Store";

export default function Chart() {
  const data = useStore((state) => state.boredom);
  const timesLocked = useStore((state) => state.timesLocked);
  // const attentionFlag = (scores) => {
  //   if (!scores) return;
  //   if (scores[scores.length-1].score < .3) {
  //     return "You gotta lock in!😤"
  //   }
  //   return "You're locked in! 🫡"
  // }
  const [flag, setFlag] = useState("");

  useEffect(() => {
    console.log(data);
    //if (!data) return;
    if (data.length === 0) return;
    setFlag(
      data[data.length - 1].score < 0.25
        ? "You gotta lock in! 😤 "
        : "You're locked in! 🫡 "
    );
  }, [data, timesLocked]);
  const formatYAxis = (value) => {
    if (value < 0.075) {
      return "🛏️";
    }
    if (value < 0.125) {
      return "😴";
    }
    if (value < 0.175) {
      return "🥱";
    }
    if (value < 0.25) {
      return "🫤";
    }
    if (value < 0.3) {
      return "😎";
    }
    return "🤓";
  };
  return (
    <div style={{ width: "100%" }}>
      <h2 style={{ textAlign: "center" }}>Locked-In Chart</h2>
      <ResponsiveContainer maxHeight={300}>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          height={300}
          width={"100%"}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time">
            <Label value="Time (ms)" offset={-5} position="insideBottom" />
          </XAxis>
          <YAxis tickMargin={-5} dataKey="score" tickFormatter={formatYAxis}>
            <Label
              value="Locked-In Score"
              angle={-90}
              position="center"
            ></Label>
          </YAxis>
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="score" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
      <h1 style={{ textAlign: "center" }}>
        {flag} Locked in{" "}
        {Math.trunc((timesLocked / data.length).toFixed(2) * 100)}% of the time
      </h1>
      <ResponsiveContainer maxHeight={300}>
        <PieChart width={"100%"} height={250}>
          <Pie
            data={[
              {
                name: "Locked In",
                value: Math.trunc((timesLocked / data.length).toFixed(2) * 100),
              },
              {
                name: "Not Locked In",
                value: Math.trunc(
                  100 - (timesLocked / data.length).toFixed(2) * 100
                ),
              },
            ]}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label
          >
            <Cell fill="#00C49F" />
            <Cell fill="#e22a2a" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
