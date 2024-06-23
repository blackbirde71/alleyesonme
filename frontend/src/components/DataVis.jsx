import React from "react";
import * as Constants from "../vis/constants";
import EngagementGraph from "../vis/EngagementGraph";
import EmotionDistributionChart from "../vis/EmotionDistributionChart";
import AttentionProportionChart from "../vis/AttentionProportionChart";
import Chart from "../vis/Chart";

export default function DataVis() {
  return (
    <div className="row-span-1 col-span-1 rounded-lg flex flex-col h-full">
      <Chart />
    </div>
  );
}
