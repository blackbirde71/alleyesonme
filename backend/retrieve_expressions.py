import cv2
import websocket
import json
import base64
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import os
from dotenv import load_dotenv


load_dotenv()

# Replace with your actual API key
API_KEY = os.environ.get("HUME_API_KEY")

# WebSocket connection to Hume AI API
ws = websocket.WebSocket()
ws.connect(f"wss://api.hume.ai/v0/stream/models?api_key={API_KEY}")

cap = cv2.VideoCapture(0)

# Initialize the plot
plt.ion()
fig, ax = plt.subplots(figsize=(15, 6))
bars = ax.bar(range(48), np.zeros(48))  # Start with 48 bars, will adjust if needed
ax.set_ylim(0, 1)

# Set Seaborn style
sns.set_style("darkgrid")
sns.set_context("talk")

# Customize plot appearance
ax.set_xlabel('Emotions', fontsize=16, fontweight='bold')
ax.set_ylabel('Intensity', fontsize=16, fontweight='bold')
ax.set_title('Real-time Emotion Intensity', fontsize=20, fontweight='bold')

# Set color palette
palette = sns.color_palette("viridis", len(bars))

# Initialize emotion labels
emotion_labels = []

while True:
    ret, frame = cap.read()
    cv2.imshow('Webcam', frame)
    
    # Convert frame to base64
    _, buffer = cv2.imencode('.jpg', frame)
    jpg_as_text = base64.b64encode(buffer).decode('utf-8')
    
    # Prepare the message for Hume AI API
    message = {
        "data": jpg_as_text,
        "models": {
            "face": {}
        }
    }
    
    # Send the frame to Hume AI API
    ws.send(json.dumps(message))
    
    # Receive and process the response
    response = json.loads(ws.recv())
    
    # Extract emotion intensities and labels from the response
    if 'face' in response and 'predictions' in response['face']:
        emotions = response['face']['predictions'][0]['emotions']
        intensities = [emotion['score'] for emotion in emotions]
        
        # Update emotion labels if not already set
        if not emotion_labels:
            emotion_labels = [emotion['name'] for emotion in emotions]
            ax.clear()  # Clear the axis to reset the number of bars
            bars = ax.bar(range(len(emotion_labels)), np.zeros(len(emotion_labels)), color=palette)
            ax.set_xticks(range(len(emotion_labels)))
            ax.set_xticklabels(emotion_labels, rotation=45, ha='right', fontsize=12)
            ax.set_ylim(0, 1)
                    

        # Update the histogram
        for bar, intensity in zip(bars, intensities):
            bar.set_height(intensity)
        
        plt.tight_layout()
        plt.draw()
        plt.pause(0.01)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
ws.close()
plt.ioff()
plt.close()
