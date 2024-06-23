import React from "react";
import { useState } from "react";

export default function ResponseFormatter({ text }) {
  const [currRecommendation, setCurrRecommendation] = useState(0);
  const recommendations = text.split(/\d+\.\s*\*\*/);
  // .filter((item) => item.trim() !== "");
  console.log(recommendations);

  const tips = recommendations.map((recommendation, index) => {
    if (index === 0) return {};
    const parts = recommendation.split("**");
    const title = parts[0].trim();
    const content = parts[1].trim();
    return { title, content };
  });
  const len = tips.length;

  return (
    <div>
      <div>
        <p>{recommendations[0].trim()}</p>
      </div>
      <div className="text-center w-full text-xl bold mt-5">
        {len + " "}Quick Tips
      </div>{" "}
      <div className="bg-primary-300 rounded-xl flex items-center py-5 mt-5">
        <div
          className="mx-4 text-xl"
          onClick={() => setCurrRecommendation((currRecommendation - 1) % len)}
        >
          ←
        </div>
        <p>
          {currRecommendation + 1}.{" "}
          <strong>
            {tips[currRecommendation + 1] && tips[currRecommendation + 1].title}
          </strong>{" "}
          {tips[currRecommendation + 1] && tips[currRecommendation + 1].content}
        </p>
        <div
          className="mx-4 text-xl"
          onClick={() =>
            setCurrRecommendation((currRecommendation + 1) % (len - 1))
          }
        >
          →
        </div>
      </div>
    </div>
  );
}
