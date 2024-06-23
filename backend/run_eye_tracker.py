from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/gaze_data', methods=['POST'])
def gaze_data():
    gaze_data = request.json
    # Process the gaze data as needed
    print(gaze_data)
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True)
    gaze_data()

