from hume import HumeStreamClient
from hume.models.config import FaceConfig
import cv2
import websocket
import json
import base64

# Replace with your actual API key
API_KEY = "OcVBQgwWGCvUyA88ahXvH54JSAFD33ZbDdHNykEAYYBRjEDp"

# WebSocket connection to Hume AI API
ws = websocket.WebSocket()
ws.connect(f"wss://api.hume.ai/v0/stream/models?api_key={API_KEY}")

cap = cv2.VideoCapture(0)

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
    # Process the response here (e.g., print or analyze the expressions)
    print(response)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
ws.close()
