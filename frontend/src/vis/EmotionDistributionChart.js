import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as Constants from './constants';

const EmotionPieChart = ({ emotionData }) => {
  const d3Container = useRef(null);

  useEffect(() => {
    if (emotionData && d3Container.current) {
      createEmotionPieChart(emotionData, d3Container.current);
    }
  }, [emotionData]);

  return <div ref={d3Container} />;
};

function createEmotionPieChart(emotionData, container) {
  // Clear any existing SVG
  d3.select(container).selectAll("*").remove();

  // Set up dimensions
  const width = 600;
  const height = 400;
  const radius = Math.min(width, height) / 2;

  // Create SVG
  const svg = d3.select(container).append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background-color", "#1e1e1e")
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  // Process data
  const emotionCounts = Array(46).fill(0);
  emotionData.forEach(e => emotionCounts[e.emotion]++);
  const data = emotionCounts.map((count, index) => ({ emotion: index, count: count }))
                            .filter(d => d.count > 0);

  // Set up color scale
  const color = d3.scaleLinear()
    .domain([0, 45])
    .range(["#1F7A8C", "#B0DB60"])
    .interpolate(d3.interpolateHcl);

  // Create pie layout
  const pie = d3.pie()
    .value(d => d.count)
    .sort(null);

  // Create arc generator
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  // Create pie slices
  const slices = svg.selectAll("path")
    .data(pie(data))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data.emotion))
    .attr("stroke", "#1e1e1e")
    .style("stroke-width", "1px");

  // Create tooltip
  const tooltip = d3.select(container)
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

  // Add hover effects
  slices.on("mouseover", function(event, d) {
    d3.select(this).transition()
      .duration(200)
      .attr("d", d3.arc().innerRadius(0).outerRadius(radius * 1.1));
    
    const emotionName = Constants.idToEmotions[d.data.emotion];
    tooltip.style("visibility", "visible")
      .html(emotionName)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 10) + "px");
  })
  .on("mouseout", function() {
    d3.select(this).transition()
      .duration(200)
      .attr("d", arc);
    
    tooltip.style("visibility", "hidden");
  });

  // Add title
  svg.append("text")
    .attr("x", 0)
    .attr("y", -height/2 + 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("fill", "#fff")
    .text("Emotion Distribution");
}

export default EmotionPieChart;