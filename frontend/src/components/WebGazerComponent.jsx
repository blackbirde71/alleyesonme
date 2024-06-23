import React, { useEffect, useRef } from 'react';


const WebGazerComponent = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    // Dynamically load WebGazer.js
    const loadWebGazer = async () => {
      const script = document.createElement('script');
      script.src = 'https://webgazer.cs.brown.edu/webgazer.js';
      script.async = true;
      script.onload = () => {
        // Initialize WebGazer
        window.webgazer
          .setGazeListener((data, elapsedTime) => {
            if (data == null) return;
            console.log(`x: ${data.x}, y: ${data.y}, time: ${elapsedTime}`);
          })
          .begin()
          .showPredictionPoints(true); // Shows a small red dot for prediction points
      };
      document.body.appendChild(script);
    };

    loadWebGazer();

    return () => {
      // Clean up WebGazer when the component is unmounted
      window.webgazer.end();
    };
  }, []);

  return (
    <div>
      <h1>WebGazer.js Demo</h1>
      <video ref={videoRef} width="640" height="480" autoPlay style={{ display: 'none' }}></video>
      <canvas id="plotting_canvas" width="" height="15" style={{ position: 'absolute' }}></canvas>
    </div>
  );
};

export default WebGazerComponent;


