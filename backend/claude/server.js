import express from 'express';
import { claude } from './claude.js';

const app = express();
const port = 7878;

app.use(express.json())

app.post('/claude', async (req, res) => {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Please provide a valid string message in the request body" });
    }
    
    const result = await claude(message);
    console.log(`resullttttt: ${result}`);
    res.json({ result });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});