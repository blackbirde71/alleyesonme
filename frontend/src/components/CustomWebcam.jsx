import React, { useEffect, useRef } from "react";
import Webcam from "react-webcam";
import { useStore } from "../Store";
import download from "downloadjs";

export default function CustomWebcam() {
  const API_KEY = "6W8ZAm2iRotx0RTXxlOesphgGBqBaF2RcedVPBQjKjfgQVyZ";
  const endpoint = `wss://api.hume.ai/v0/stream/models?api_key=${API_KEY}`;
  const addBoredom = useStore((state) => state.addBoredom);

  const webcamRef = useRef(null);
  const [currentEmotion, setCurrentEmotion] = React.useState("");
  const emotionData = useRef([]);

  useEffect(() => {
    const ws = new WebSocket(endpoint);
    let count = 0;

    ws.onopen = () => {
      console.log("Connected to Hume AI WebSocket");

      const sessionDuration = 30000;
      const intervalTime = 1000;
      const sessionStartTime = Date.now();

      const interval = setInterval(() => {
        if (!webcamRef.current) return;
        if (Date.now() - sessionStartTime >= sessionDuration) {
          clearInterval(interval);
          ws.close();
          return;
        }

        const imageData = webcamRef.current.getScreenshot();
        if (imageData) {
          const base64Data = imageData.split(",")[1];
          const message = {
            data: base64Data,
            models: { face: {} },
          };
          ws.send(JSON.stringify(message));
        }
      }, intervalTime);
    };

    ws.onmessage = (event) => {
      const response = JSON.parse(event.data);

      if (
        response.face &&
        response.face.predictions &&
        response.face.predictions[0] &&
        response.face.predictions[0].emotions
      ) {
        const emotions = response.face.predictions[0].emotions;

        const highestEmotion = emotions.reduce((prev, current) =>
          prev.score > current.score ? prev : current
        );

        setCurrentEmotion(highestEmotion.name);
        count++;

        // Store the emotion and time data
        emotionData.current.push({
          emotion: highestEmotion.name,
          time: new Date().toLocaleString(),
        });
        const scores = [response.face.predictions[0].emotions[9].score, 
          response.face.predictions[0].emotions[10].score, 
          response.face.predictions[0].emotions[12].score,
          response.face.predictions[0].emotions[16].score,
          response.face.predictions[0].emotions[13].score,
          response.face.predictions[0].emotions[23].score,
          response.face.predictions[0].emotions[29].score,
          response.face.predictions[0].emotions[35].score,
          response.face.predictions[0].emotions[39].score,
          response.face.predictions[0].emotions[45].score]

        addBoredom({
          score: Math.max.apply(Math, scores),
          time: count * 1000,
        });
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from Hume AI WebSocket");
      // Download the emotion data as a JSON file
      const jsonData = JSON.stringify(emotionData.current, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      download(blob, "emotion_data.json", "application/json");
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div>
      <Webcam ref={webcamRef} />
      <div>Current Emotion: {currentEmotion}</div>
    </div>
  );
}