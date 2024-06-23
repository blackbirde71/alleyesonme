import axios from 'axios';


/// returns a String response
async function ClaudeRequest(prompt) {
    try {
        const result = await axios.post('http://localhost:7878/claude', {
            message: prompt
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return result["data"]["result"];
    } catch (err) {
        console.error(err);
    }
}

export default ClaudeRequest;