const API_KEY = "ENTER API KEY";
const endpoint = `wss://api.hume.ai/v0/stream/models?api_key=${API_KEY}`;
const video = document.getElementById('video');

// Function to start video capture
async function startVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (err) {
        console.error('Error accessing webcam:', err);
    }
}

// Function to capture a frame from the video
function captureFrame() {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg').split(',')[1]; // Get base64 encoded image data
}

// Create WebSocket connection
const ws = new WebSocket(endpoint);

ws.onopen = () => {
    console.log('Connected to Hume AI WebSocket');

    // Send frames at regular intervals
    const sessionDuration = 20000; // 20 seconds
    const intervalTime = 1000; // Send a frame every second
    const sessionStartTime = Date.now();

    const interval = setInterval(() => {
        if (Date.now() - sessionStartTime >= sessionDuration) {
            clearInterval(interval);
            ws.close();
            return;
        }

        const imageData = captureFrame();

        const message = {
            data: imageData,
            models: {
                face: {}
            }
        };

        ws.send(JSON.stringify(message));
    }, intervalTime);
};

ws.onmessage = (event) => {
    const response = JSON.parse(event.data);
    
    // Log the entire response
    console.log('Full response from Hume AI:');
    console.log(JSON.stringify(response, null, 2)); // Pretty print JSON
};

ws.onclose = () => {
    console.log('Disconnected from Hume AI WebSocket');
};

ws.onerror = (err) => {
    console.error('WebSocket error:', err);
};

// Start video capture
startVideo();
