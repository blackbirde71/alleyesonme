import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import { useStore } from "../Store";
import MicRecorder from "mic-recorder-to-mp3";
import "./customWebcam.css";

const recorder = new MicRecorder({ bitRate: 128 });

export default function CustomWebcam() {
  const API_KEY = "6W8ZAm2iRotx0RTXxlOesphgGBqBaF2RcedVPBQjKjfgQVyZ";
  const endpoint = `wss://api.hume.ai/v0/stream/models?api_key=${API_KEY}`;
  const addBoredom = useStore((state) => state.addBoredom);

  const webcamRef = useRef(null);
  const [currentEmotion, setCurrentEmotion] = useState("");
  const emotionData = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPath, setPdfPath] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [transcriptions, setTranscriptions] = useState(null);

  const startRecording = () => {
    setIsRecording(true);
    emotionData.current = []; // Reset emotion data
    recorder
      .start()
      .then(() => {
        console.log("Recording started");
        startEmotionDetection();
      })
      .catch((error) => {
        console.error("Error starting recording:", error);
        setIsRecording(false);
      });
  };

  const stopRecording = () => {
    setIsRecording(false);
    stopEmotionDetection();
  };

  const startEmotionDetection = () => {
    wsRef.current = new WebSocket(endpoint);
    let count = 0;

    wsRef.current.onopen = () => {
      console.log("Connected to Hume AI WebSocket");

      const intervalTime = 1000;
      intervalRef.current = setInterval(() => {
        if (!webcamRef.current) return;

        const imageData = webcamRef.current.getScreenshot();
        if (imageData) {
          const base64Data = imageData.split(",")[1];
          const message = {
            data: base64Data,
            models: { face: {} },
          };
          wsRef.current.send(JSON.stringify(message));
        }
      }, intervalTime);
    };

    wsRef.current.onmessage = (event) => {
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

    wsRef.current.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
  };

  const stopEmotionDetection = () => {
    if (wsRef.current) {
      wsRef.current.close();
      console.log("Disconnected from Hume AI WebSocket");
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const jsonData = JSON.stringify(emotionData.current, null, 2);
    const jsonBlob = new Blob([jsonData], { type: "application/json" });

    recorder
      .stop()
      .getMp3()
      .then(([buffer, mp3Blob]) => {
        const formData = new FormData();
        formData.append("jsonFile", jsonBlob, "emotion_data.json");
        formData.append("mp3File", mp3Blob, "recording.mp3");

        fetch("http://127.0.0.1:5000/upload", {
          method: "POST",
          body: formData,
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            handlePreprocessedData(data);
          })
          .catch((error) => {
            console.error("Error uploading or processing data:", error);
          });
      })
      .catch((error) => {
        console.error("Error stopping recording:", error);
      });
  };

  const handlePreprocessedData = (data) => {
    // Save preprocessed JSON data
    const preprocessedJson = JSON.stringify(data, null, 2);
    const preprocessedBlob = new Blob([preprocessedJson], { type: "application/json" });
    downloadBlob(preprocessedBlob, "preprocessed_data.json");

    // Save transcriptions
    const transcriptionsJson = JSON.stringify(data.transcriptions, null, 2);
    const transcriptionsBlob = new Blob([transcriptionsJson], { type: "application/json" });
    downloadBlob(transcriptionsBlob, "transcriptions.json");
    setTranscriptions(data.transcriptions);

    // Handle audio snippets if needed
    data.audio_snippets.forEach((base64Audio, index) => {
      const binaryAudio = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(binaryAudio.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < binaryAudio.length; i++) {
        view[i] = binaryAudio.charCodeAt(i);
      }
      const blob = new Blob([arrayBuffer], {type: 'audio/mp3'});
      downloadBlob(blob, `audio_snippet_${index + 1}.mp3`);
    });
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePdfUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const uploadPdf = () => {
    if (!pdfFile) {
      alert("Please select a PDF file first.");
      return;
    }

    const formData = new FormData();
    formData.append("pdfFile", pdfFile);

    fetch("http://127.0.0.1:5000/upload_pdf", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("PDF processed successfully:", data);
        setPdfPath(data.pdf_path);
        alert(`PDF processed successfully. Filename: ${data.filename}`);
      })
      .catch((error) => {
        console.error("Error uploading PDF:", error);
        alert("Error uploading PDF. Please try again.");
      });
  };

  const analyzeContent = () => {
    if (!pdfPath || !transcriptions) {
      alert("Please upload a PDF and complete a recording session first.");
      return;
    }

    fetch("http://127.0.0.1:5000/analyze", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdf_path: pdfPath,
        transcriptions: transcriptions,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setAnalysis(data.analysis);
      })
      .catch((error) => {
        console.error("Error analyzing content:", error);
        alert("Error analyzing content. Please try again.");
      });
  };

  return (
    <div>
      <Webcam ref={webcamRef} />
      <div>Current Emotion: {currentEmotion}</div>
      <button
        className={`record-button ${isRecording ? "recording" : ""}`}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      <div>
        <input type="file" accept=".pdf" onChange={handlePdfUpload} />
        <button onClick={uploadPdf} disabled={!pdfFile}>
          Upload PDF
        </button>
      </div>
      <button onClick={analyzeContent} disabled={!pdfPath || !transcriptions}>
        Analyze Content
      </button>
      {analysis && (
        <div>
          <h2>Analysis Results:</h2>
          <p>{analysis}</p>
        </div>
      )}
    </div>
  );
}
