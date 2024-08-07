import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import { useStore } from "../Store";
import MicRecorder from "mic-recorder-to-mp3";
import "./customWebcam.css";
import ResponseFormatter from "./ResponseFormatter";

const recorder = new MicRecorder({ bitRate: 128 });

export default function CustomWebcam() {
  const API_KEY = "6W8ZAm2iRotx0RTXxlOesphgGBqBaF2RcedVPBQjKjfgQVyZ";
  const endpoint = `wss://api.hume.ai/v0/stream/models?api_key=${API_KEY}`;
  const addBoredom = useStore((state) => state.addBoredom);
  const addTimesLocked = useStore((state) => state.addTimesLocked);

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const setPdf = useStore((state) => state.setPdf);

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

        const scores = [
          response.face.predictions[0].emotions[9].score,
          response.face.predictions[0].emotions[10].score,
          response.face.predictions[0].emotions[12].score,
          response.face.predictions[0].emotions[16].score,
          response.face.predictions[0].emotions[13].score,
          response.face.predictions[0].emotions[23].score,
          response.face.predictions[0].emotions[29].score,
          response.face.predictions[0].emotions[35].score,
          response.face.predictions[0].emotions[39].score,
          response.face.predictions[0].emotions[45].score,
        ];

        const badScores = [
          response.face.predictions[0].emotions[8].score,
          response.face.predictions[0].emotions[4].score,
          response.face.predictions[0].emotions[11].score,
          response.face.predictions[0].emotions[19].score,
          response.face.predictions[0].emotions[44].score,
        ];

        const sum = (array) => {
          let ans = 0;
          array.forEach((num) => {
            ans += num;
          });
          return ans;
        };

        const chooseScore = () => {
          let boredomVal = response.face.predictions[0].emotions[8].score;
          let goodAvg = sum(scores) / scores.length;
          let badAvg = (sum(badScores) - boredomVal) / (badScores.length - 1);

          let wAvg = goodAvg - goodAvg * (1 - (4 * boredomVal + badAvg) / 2);
          if (wAvg > 0.6) return 0.6;
          return wAvg;
        };

        addBoredom({
          score: chooseScore(),
          time: count * 1000,
        });
        if (chooseScore() >= 0.3) {
          addTimesLocked();
        }
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
    const preprocessedBlob = new Blob([preprocessedJson], {
      type: "application/json",
    });
    downloadBlob(preprocessedBlob, "preprocessed_data.json");

    // Save transcriptions
    const transcriptionsJson = JSON.stringify(data.transcriptions, null, 2);
    const transcriptionsBlob = new Blob([transcriptionsJson], {
      type: "application/json",
    });
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
      const blob = new Blob([arrayBuffer], { type: "audio/mp3" });
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
      setPdf(URL.createObjectURL(file));
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
    setIsAnalyzing(true);
    fetch("http://127.0.0.1:5000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pdf_path: pdfPath,
        transcriptions: transcriptions,
      }),
    })
      .then((response) => {
        setIsAnalyzing(false);
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
    <div className="">
      <Webcam ref={webcamRef} />
      <div>Current Emotion: {currentEmotion}</div>
      <button
        className={`${
          isRecording
            ? "text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 shadow-lg shadow-red-500/50 dark:shadow-lg dark:shadow-red-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
            : "text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 shadow-lg shadow-green-500/50 dark:shadow-lg dark:shadow-green-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
        }`}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      <div>
        <input
          type="file"
          accept=".pdf"
          onChange={handlePdfUpload}
          className="block w-full text-sm mb-5 mt-3 border border-primary-300 rounded-lg cursor-pointer bg-primary-400 focus:outline-none text-primary-100 "
        />
        <button
          onClick={uploadPdf}
          disabled={!pdfFile}
          className="text-white bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-purple-300 dark:focus:ring-purple-800 shadow-lg shadow-purple-500/50 dark:shadow-lg dark:shadow-purple-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
        >
          Upload PDF
        </button>
      </div>
      <button
        onClick={analyzeContent}
        disabled={!pdfPath || !transcriptions}
        className={`text-white bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-pink-300 dark:focus:ring-pink-800 shadow-lg shadow-pink-500/50 dark:shadow-lg dark:shadow-pink-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 ${
          !pdfPath || !transcriptions ? "opacity-25" : ""
        }`}
      >
        {isAnalyzing ? (
          <svg
            aria-hidden="true"
            role="status"
            class="inline w-4 h-4 me-3 text-white animate-spin"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="#E5E7EB"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <> Analyze Content</>
        )}
      </button>
      {analysis && (
        <div>
          <h2>Analysis Results:</h2>
          <ResponseFormatter text={analysis} />
        </div>
      )}
    </div>
  );
}
