import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import * as Constants from "./constants";

const AttentionProportionChart = ({ studentsAttentionData, duration }) => {
  const d3Container = useRef(null);

  useEffect(() => {
    if (studentsAttentionData && d3Container.current) {
      createAttentionProportionChart(
        studentsAttentionData,
        duration,
        d3Container.current
      );
    }
  }, [studentsAttentionData, duration]);

  return (
    <div
      className="w-full h-full rounded-xl overflow-hidden"
      ref={d3Container}
    />
  );
};

function createAttentionProportionChart(
  studentsAttentionData,
  duration,
  container
) {
  // Clear any existing SVG
  d3.select(container).selectAll("*").remove();

  // Set up dimensions
  const margin = { top: 80, right: 20, bottom: 60, left: 80 };
  const width = 500 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  // Create SVG
  const svg = d3
    .select(container)
    .append("svg")
    // .attr("width", width + margin.left + margin.right)
    // .attr("height", height + margin.top + margin.bottom)
    .style("background-color", "#171715")
    .style("width", "100%")
    .style("height", "100%")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Process data
  const timeSteps = 100; // Number of time steps to sample
  const timeInterval = duration / timeSteps;

  const attentionProportions = Array(timeSteps)
    .fill(0)
    .map((_, index) => {
      const time = index * timeInterval;
      const studentsPayingAttention = studentsAttentionData.filter(
        (studentData) => {
          const lastAttentionBefore = studentData.findLast(
            (a) => a.timestamp <= time
          );
          return lastAttentionBefore && lastAttentionBefore.ifLooking;
        }
      );
      return {
        time: time,
        proportion:
          studentsPayingAttention.length / studentsAttentionData.length,
      };
    });

  // Set up scales
  const x = d3.scaleLinear().domain([0, duration]).range([0, width]);

  const y = d3.scaleLinear().domain([0, 1]).range([height, 0]);

  // Create line generator
  const line = d3
    .line()
    .x((d) => x(d.time))
    .y((d) => y(d.proportion))
    .curve(d3.curveMonotoneX);

  // Create area generator
  const area = d3
    .area()
    .x((d) => x(d.time))
    .y0(height)
    .y1((d) => y(d.proportion))
    .curve(d3.curveMonotoneX);

  // Add gradient
  const gradient = svg
    .append("defs")
    .append("linearGradient")
    .attr("id", "area-gradient")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", 0)
    .attr("y1", y(0))
    .attr("x2", 0)
    .attr("y2", y(1));

  gradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", Constants.accentColor)
    .attr("stop-opacity", 0);

  gradient
    .append("stop")
    .attr("offset", "80%")
    .attr("stop-color", Constants.accentColor)
    .attr("stop-opacity", 0.5);

  gradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", Constants.accentColor)
    .attr("stop-opacity", 0.8);

  // Add the area
  svg
    .append("path")
    .datum(attentionProportions)
    .attr("fill", "url(#area-gradient)")
    .attr("d", area);

  // Add the line path
  svg
    .append("path")
    .datum(attentionProportions)
    .attr("fill", "none")
    .attr("stroke", Constants.accentColor)
    .attr("stroke-width", 2)
    .attr("d", line);

  // Add x-axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3
        .axisBottom(x)
        .tickFormat(
          (d) =>
            `${Math.floor(d / 60000)}:${String(
              Math.floor((d % 60000) / 1000)
            ).padStart(2, "0")}`
        )
    )
    .attr("color", "#666")
    .select(".domain")
    .attr("stroke", "#666");

  // Add y-axis
  svg
    .append("g")
    .call(d3.axisLeft(y).tickFormat(d3.format(".0%")))
    .attr("color", "#666")
    .select(".domain")
    .attr("stroke", "#666");

  // Add title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 0 - margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .attr("fill", "#fff")
    .text("Student Attention Over Time");

  // Add horizontal grid lines
  svg
    .selectAll("horizontal-grid")
    .data(y.ticks(5))
    .enter()
    .append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", (d) => y(d))
    .attr("y2", (d) => y(d))
    .attr("stroke", "#333")
    .attr("stroke-dasharray", "2,2");

  // Create tooltip
  const tooltip = d3
    .select(container)
    .append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "rgba(0, 0, 0, 0.7)")
    .style("color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-color", "#666")
    .style("border-radius", "5px")
    .style("padding", "5px 10px")
    .style("font-size", "14px");

  // Create a rect on top of the svg area: this rectangle recovers mouse position
  const overlay = svg
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all");

  // Create the vertical line
  const verticalLine = svg
    .append("line")
    .attr("stroke", "#666")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3,3")
    .style("opacity", 0);

  // Create the hover effect
  overlay
    .on("mousemove", function (event) {
      const [mouseX] = d3.pointer(event, this);
      const xValue = x.invert(mouseX);

      // Check if we're within the bounds of the data
      if (xValue >= 0 && xValue <= duration) {
        const bisect = d3.bisector((d) => d.time).left;
        const index = bisect(attentionProportions, xValue, 1);

        // Ensure we're not at the edges of the data
        if (index > 0 && index < attentionProportions.length) {
          const d0 = attentionProportions[index - 1];
          const d1 = attentionProportions[index];
          const d = xValue - d0.time > d1.time - xValue ? d1 : d0;

          verticalLine
            .attr("x1", x(d.time))
            .attr("x2", x(d.time))
            .attr("y1", 0)
            .attr("y2", height)
            .style("opacity", 1);

          const minutes = Math.floor(d.time / 60000);
          const seconds = Math.floor((d.time % 60000) / 1000);

          tooltip
            .style("visibility", "visible")
            .html(
              `Time: ${minutes}:${seconds
                .toString()
                .padStart(2, "0")}<br>Attention: ${(d.proportion * 100).toFixed(
                1
              )}%`
            )
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 10 + "px");
        } else {
          hideTooltipAndLine();
        }
      } else {
        hideTooltipAndLine();
      }
    })
    .on("mouseout", hideTooltipAndLine);

  function hideTooltipAndLine() {
    verticalLine.style("opacity", 0);
    tooltip.style("visibility", "hidden");
  }
}

export default AttentionProportionChart;
