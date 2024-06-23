import json
import base64
import tempfile
import os
from pypdf import PdfReader
import requests
import whisper
from flask import Flask, request, jsonify, send_file, make_response
from flask_cors import CORS
from datetime import datetime
from io import BytesIO
from pydub import AudioSegment

import warnings
warnings.filterwarnings("ignore", message="FP16 is not supported on CPU; using FP32 instead")

app = Flask(__name__)
CORS(app, resources={r"/upload": {"origins": "http://localhost:3000"}, r"/upload_pdf": {"origins": "http://localhost:3000"}, r"/analyze": {"origins": "http://localhost:3000"}})

# Load the Whisper model (you can choose different model sizes: tiny, base, small, medium, large)
model = whisper.load_model("base")

def time_difference_ms(time1, time2):
    t1 = datetime.strptime(time1, '%m/%d/%Y, %I:%M:%S %p')
    t2 = datetime.strptime(time2, '%m/%d/%Y, %I:%M:%S %p')
    return (t2 - t1).total_seconds() * 1000

def identify_non_concentration_intervals(emotion_data):
    intervals = []
    start_time = None
    end_time = None

    app.logger.info(f"Processing {len(emotion_data)} emotion data points.")

    for i in range(len(emotion_data)):
        current_emotion = emotion_data[i]['emotion']
        current_time = emotion_data[i]['time']

        app.logger.info(f"Processing emotion data point {i + 1}: {current_emotion} at {current_time}")

        if current_emotion != 'Concentration':
            if start_time is None:
                start_time = current_time
            end_time = current_time
        else:
            if start_time is not None and end_time is not None:
                if is_valid_interval(start_time, end_time):
                    intervals.append((start_time, end_time))
                    app.logger.info(f"Found non-concentration interval: {start_time} - {end_time}")
                start_time = None
                end_time = None

    # Check if there is an ongoing non-concentration interval at the end
    if start_time is not None and end_time is not None:
        if is_valid_interval(start_time, end_time):
            intervals.append((start_time, end_time))
            app.logger.info(f"Found non-concentration interval: {start_time} - {end_time}")

    app.logger.info(f"Found {len(intervals)} non-concentration intervals.")
    return intervals

def is_valid_interval(start_time, end_time):
    start = datetime.strptime(start_time, '%m/%d/%Y, %I:%M:%S %p')
    end = datetime.strptime(end_time, '%m/%d/%Y, %I:%M:%S %p')
    duration = (end - start).total_seconds()
    return duration > 2

def extract_audio_snippets(audio, json_data, formatted_intervals):
    audio_snippets = []
    for interval in formatted_intervals:
        start_time = datetime.strptime(interval["start_time"], '%m/%d/%Y, %I:%M:%S %p')
        end_time = datetime.strptime(interval["end_time"], '%m/%d/%Y, %I:%M:%S %p')
        start_ms = time_difference_ms(json_data[0]["time"], interval["start_time"])
        end_ms = time_difference_ms(json_data[0]["time"], interval["end_time"])
        
        app.logger.info(f"Extracting audio snippet from {start_ms}ms to {end_ms}ms")
        
        snippet = audio[int(start_ms):int(end_ms)]
        
        if len(snippet) > 0:
            # Export the snippet to a bytes buffer
            buffer = BytesIO()
            snippet.export(buffer, format="mp3")
            # Encode the buffer as base64
            base64_audio = base64.b64encode(buffer.getvalue()).decode('utf-8')
            audio_snippets.append(base64_audio)
            app.logger.info(f"Extracted snippet of length {len(snippet)}ms")
        else:
            app.logger.warning(f"Empty snippet extracted for interval {interval}")
    
    return audio_snippets

def transcribe_audio(audio_base64):
    # Decode base64 audio
    audio_data = base64.b64decode(audio_base64)
    
    # Save to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
        temp_audio.write(audio_data)
        temp_audio_path = temp_audio.name
    
    try:
        # Transcribe the audio
        result = model.transcribe(temp_audio_path)
        return result["text"]
    finally:
        # Clean up the temporary file
        os.unlink(temp_audio_path)

@app.route('/upload', methods=['POST'])
def upload_files():
    app.logger.info("Upload request received")
    json_file = None
    mp3_file = None
    audio = None

    try:
        json_file = request.files.get('jsonFile')
        mp3_file = request.files.get('mp3File')

        app.logger.info(f"JSON file: {json_file}")
        app.logger.info(f"MP3 file: {mp3_file}")

        if json_file is None or mp3_file is None:
            app.logger.error("Missing JSON or MP3 file in the request.")
            return jsonify({'error': 'Missing JSON or MP3 file'}), 400

        # Process the JSON file
        try:
            json_data = json.load(json_file)
            app.logger.info(f"Received JSON data: {json_data}")
        except json.JSONDecodeError as e:
            app.logger.error(f"Invalid JSON file: {str(e)}")
            return jsonify({'error': 'Invalid JSON file'}), 400

        # Identify time intervals where emotion is not "Concentration"
        non_concentration_intervals = identify_non_concentration_intervals(json_data)

        app.logger.info(f"Non-concentration intervals: {non_concentration_intervals}")

        # Format the time intervals as a list of dictionaries
        formatted_intervals = [
            {
                "start_time": interval[0],
                "end_time": interval[1]
            }
            for interval in non_concentration_intervals
        ]

        app.logger.info(f"Formatted intervals: {formatted_intervals}")

        # Load the MP3 file
        audio = AudioSegment.from_mp3(mp3_file)

        # Extract audio snippets based on the time intervals
        audio_snippets = extract_audio_snippets(audio, json_data, formatted_intervals)

        # Transcribe each audio snippet
        transcriptions = []
        for i, snippet in enumerate(audio_snippets):
            transcription = transcribe_audio(snippet)
            transcriptions.append({
                "snippet_index": i,
                "interval": formatted_intervals[i],
                "transcription": transcription
            })

        # Create a dictionary with the preprocessed data, audio snippets, and transcriptions
        preprocessed_data = {
            "non_concentration_intervals": formatted_intervals,
            "emotion_data": json_data,
            "audio_snippets": audio_snippets,
            "transcriptions": transcriptions
        }

        app.logger.info(f"Number of audio snippets: {len(preprocessed_data['audio_snippets'])}")

        # Convert the preprocessed data to JSON
        preprocessed_json = json.dumps(preprocessed_data, indent=2)

        # Create a BytesIO object with the JSON data
        preprocessed_file = BytesIO(preprocessed_json.encode('utf-8'))
        preprocessed_file.seek(0)

        # Create a response object with the file data
        response = make_response(send_file(preprocessed_file, mimetype='application/json'))
        response.headers['Content-Disposition'] = 'attachment; filename=preprocessed_data.json'

        return response

    except Exception as e:
        app.logger.error(f"Error processing files: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

    finally:
        # Clean up resources
        if json_file:
            json_file.close()
        if mp3_file:
            mp3_file.close()
        if audio:
            del audio
        app.logger.info("Resources cleaned up, ready for next request")

@app.route('/upload_pdf', methods=['POST'])
def upload_pdf():
    app.logger.info("PDF upload request received")
    
    try:
        pdf_file = request.files.get('pdfFile')

        if pdf_file is None:
            app.logger.error("Missing PDF file in the request.")
            return jsonify({'error': 'Missing PDF file'}), 400

        # Log that the PDF was received successfully
        app.logger.info(f"PDF received successfully: {pdf_file.filename}")

        # Save the PDF temporarily
        pdf_path = f"temp_{pdf_file.filename}"
        pdf_file.save(pdf_path)

        return jsonify({'message': 'PDF received successfully', 'filename': pdf_file.filename, 'pdf_path': pdf_path}), 200

    except Exception as e:
        app.logger.error(f"Error processing PDF file: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
    



@app.route('/analyze', methods=['POST'])
def analyze_content():
    app.logger.info("Analysis request received")
    
    try:
        pdf_path = request.json.get('pdf_path')
        transcriptions = request.json.get('transcriptions')

        app.logger.info(f"Received PDF path: {pdf_path}")
        app.logger.info(f"Received transcriptions: {transcriptions}")

        def send_request_to_claude():
            reader = PdfReader("temp_Copy of 17-sorting2 (1).pdf")
            presentation = ''.join(page.extract_text() for page in reader.pages)
            transcript = json.dumps(transcriptions)
            
            prompt = f"""
            There is an excerpt from a professor's speech on class that was based on the presentation attached. One student missed a part that corresponds exactly to the the excerpt. Please summarize the content that the student has missed based on the speech and a corresponding part of the presentation. Also indicate which slides exactly the student missed and needs to revise. Be mindful that the transcript might be not exactly accurate. Speak as if you are texting it to the student directly.

            This is the excerpt:
            {transcript}

            This is the presentation:
            {presentation}
            """
            url = 'http://localhost:7878/claude'
            headers = {
                'Content-Type': 'application/json'
            }
            data = {
                'message': prompt
            }

            try:
                response = requests.post(url, headers=headers, json=data)
                response.raise_for_status()  # Raises an HTTPError if the HTTP request returned an unsuccessful status code
                
                # Print the response status code
                app.logger.info(f"Status Code: {response.status_code}")
                
                # Print the response JSON
                app.logger.info("Response:")
                app.logger.info(json.dumps(response.json(), indent=2))
                return response.json()["result"];
                
            except requests.exceptions.RequestException as e:
                app.logger.info(f"An error occurred: {e}")


        # if not pdf_path or not transcriptions:
        #     app.logger.error("Missing PDF path or transcriptions in the request.")
        #     return jsonify({'error': 'Missing PDF path or transcriptions'}), 400

        # # Read PDF content (you might need to use a PDF library like PyPDF2 for this)
        # with open(pdf_path, 'rb') as pdf_file:
        #     pdf_content = pdf_file.read()

        # # Prepare the message for OpenAI
        # message = f"PDF Content: {pdf_content[:1000]}...\n\nTranscriptions: {json.dumps(transcriptions)}\n\nBased on the PDF content and the transcriptions of the student's non-concentration periods, please identify areas the student should focus on and provide recommendations for improvement."

        # # Send request to OpenAI
        # response = client.chat.completions.create(
        #     model="gpt-3.5-turbo",
        #     messages=[
        #         {"role": "system", "content": "You are an AI tutor tasked with analyzing a student's performance and providing focused recommendations."},
        #         {"role": "user", "content": message}
        #     ]
        # )

        # # Extract the AI's response
        # ai_response = response.choices[0].message.content

        # app.logger.info(f"OpenAI response: {ai_response}")

        # # Clean up: remove temporary PDF file
        # os.remove(pdf_path)

        ai_response = send_request_to_claude()

        return jsonify({'analysis': ai_response}), 200

    except Exception as e:
        app.logger.error(f"Error analyzing content: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, threaded=True)