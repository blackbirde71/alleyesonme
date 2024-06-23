import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as Constants from './constants';


const EngagementGraph = ({ attentionData, slideData, startSlide = 0, endSlide }) => {
  const d3Container = useRef(null);

  useEffect(() => {
    if (attentionData && slideData && d3Container.current) {
      createEngagementGraph(attentionData, slideData, d3Container.current, startSlide, endSlide);
    }
  }, [attentionData, slideData, startSlide, endSlide]);

  return <div ref={d3Container} />;
};

function createEngagementGraph(attentionData, slideData, container, startSlide = 0, endSlide) {
  // Clear any existing SVG
  d3.select(container).selectAll("*").remove();

  // Set up dimensions
  const margin = { top: 20, right: 20, bottom: 30, left: 50 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Create SVG
  const svg = d3.select(container).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background-color", "#1e1e1e")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // If endSlide is not provided, set it to the last slide
  if (endSlide === undefined) endSlide = slideData.length - 1;

  // Process data for the selected range of slides
  const engagementData = slideData.slice(startSlide, endSlide + 1).map((slide, index) => {
    const nextSlideTime = slideData[startSlide + index + 1] ? slideData[startSlide + index + 1].timestamp : Infinity;
    const relevantAttention = attentionData.filter(a => 
      a.timestamp >= slide.timestamp && a.timestamp < nextSlideTime
    );
    const lookingCount = relevantAttention.filter(a => a.ifLooking).length;
    return {
      slide: startSlide + index + 1,
      engagement: relevantAttention.length > 0 ? lookingCount / relevantAttention.length : 0
    };
  });

  // Set up scales
  const x = d3.scaleBand()
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .range([height, 0]);

  x.domain(engagementData.map(d => d.slide));
  y.domain([0, 1]);

  // Create bars
  svg.selectAll(".bar")
    .data(engagementData)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.slide))
      .attr("width", x.bandwidth())
      .attr("y", d => y(d.engagement))
      .attr("height", d => height - y(d.engagement))
      .attr("fill", Constants.accentColor);  // Solid color

  // Add x-axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .attr("color", "#666")
    .select(".domain")
    .attr("stroke", "#666");

  // Add y-axis
  svg.append("g")
    .call(d3.axisLeft(y)
      .ticks(5)
      .tickFormat(d3.format(".0%")))
    .attr("color", "#666")
    .select(".domain")
    .attr("stroke", "#666");

  // Add title
  svg.append("text")
    .attr("x", 10)
    .attr("y", -5)
    .attr("fill", "#fff")
    .style("font-size", "14px")
    .text(`Engagement for Slides ${startSlide + 1}-${endSlide + 1}`);

  // Add horizontal grid lines
  svg.selectAll("horizontal-grid")
    .data(y.ticks(5))
    .enter().append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", d => y(d))
    .attr("y2", d => y(d))
    .attr("stroke", "#333")
    .attr("stroke-dasharray", "2,2");
}

export default EngagementGraph;