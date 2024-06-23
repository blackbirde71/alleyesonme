import React from "react";
import Webcam from "react-webcam";
import { useStore } from "../Store";

export default function CustomWebcam() {
  const API_KEY = "6W8ZAm2iRotx0RTXxlOesphgGBqBaF2RcedVPBQjKjfgQVyZ";
  const endpoint = `wss://api.hume.ai/v0/stream/models?api_key=${API_KEY}`;
  const addBoredom = useStore((state) => state.addBoredom);

  const webcamRef = React.useRef(null);
  // Create WebSocket connection
  const ws = new WebSocket(endpoint);
  var count = 0;

  ws.onopen = () => {
    console.log("Connected to Hume AI WebSocket");

    // Send frames at regular intervals
    const sessionDuration = 20000; // 20 seconds
    const intervalTime = 1000; // Send a frame every second
    const sessionStartTime = Date.now();

    const interval = setInterval(() => {
      if (!webcamRef.current) {
        return;
      }
      if (Date.now() - sessionStartTime >= sessionDuration) {
        clearInterval(interval);
        ws.close();
        return;
      }

      const imageData = webcamRef.current.getScreenshot().split(",")[1];

      const message = {
        data: imageData,
        models: {
          face: {},
        },
      };

      ws.send(JSON.stringify(message));
    }, intervalTime);
  };

  ws.onmessage = (event) => {
    const response = JSON.parse(event.data);

    // Log the entire response
    console.log("Full response from Hume AI:");
    //console.log(JSON.stringify(response, null, 2)); // Pretty print JSON
    if (!response.face) {
      return;
    }
    if (!response.face.predictions) {
      return;
    }
    if (!response.face.predictions[0].emotions) {
      return;
    }
    if (!response.face.predictions[0].emotions[0]) {
      return;
    }
    count++;
    console.log(count);
    addBoredom({
      score: response.face.predictions[0].emotions[0].score,
      time: count * 1000,
    });
  };

  ws.onclose = () => {
    console.log("Disconnected from Hume AI WebSocket");
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
  };
  return (
    <div>
      <Webcam ref={webcamRef} />
    </div>
  );
}
