import dotenv from 'dotenv'

import {
    BedrockRuntimeClient,
    InvokeModelCommand,
    InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config()

export async function claude(prompt) {/**
 * @typedef {Object} ResponseContent
 * @property {string} text
 *
 * @typedef {Object} MessagesResponseBody
 * @property {ResponseContent[]} content
 *
 * @typedef {Object} Delta
 * @property {string} text
 *
 * @typedef {Object} Message
 * @property {string} role
 *
 * @typedef {Object} Chunk
 * @property {string} type
 * @property {Delta} delta
 * @property {Message} message
 */

    /**
     * Invokes Anthropic Claude 3 using the Messages API.
     *
     * To learn more about the Anthropic Messages API, go to:
     * https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages.html
     *
     * @param {string} prompt - The input text prompt for the model to complete.
     * @param {string} [modelId] - The ID of the model to use. Defaults to "anthropic.claude-3-haiku-20240307-v1:0".
     */
    const invokeModel = async (
        prompt,
        modelId = "anthropic.claude-3-haiku-20240307-v1:0",
    ) => {
        // Create a new Bedrock Runtime client instance.
        const client = new BedrockRuntimeClient({ region: "us-east-1" });

        // // Read the uploaded file and convert to base64
        // const imagePath = path.join(__dirname, './image.jpeg');
        // const imageBuffer = await fs.readFile(imagePath);
        // const base64Image = imageBuffer.toString('base64');

        // Prepare the payload for the model.
        const payload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 1000,
            messages: [
                {
                    role: "user",
                    content: [
                        // {
                        //     type: "image",
                        //     source: {
                        //         type: "base64",
                        //         media_type: "image/jpeg",
                        //         data: base64Image,
                        //     }
                        // }, 
                        {
                            type: "text",
                            text: prompt, 
                        }
                    ],
                },
            ],
        };

        // Invoke Claude with the payload and wait for the response.
        const command = new InvokeModelCommand({
            contentType: "application/json",
            body: JSON.stringify(payload),
            modelId,
        });
        const apiResponse = await client.send(command);

        // Decode and return the response(s)
        const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
        /** @type {MessagesResponseBody} */
        const responseBody = JSON.parse(decodedResponseBody);
        return responseBody.content[0].text;
    };

    /**
     * Invokes Anthropic Claude 3 and processes the response stream.
     *
     * To learn more about the Anthropic Messages API, go to:
     * https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages.html
     *
     * @param {string} prompt - The input text prompt for the model to complete.
     * @param {string} [modelId] - The ID of the model to use. Defaults to "anthropic.claude-3-haiku-20240307-v1:0".
     */
    const invokeModelWithResponseStream = async (
        prompt,
        modelId = "anthropic.claude-3-haiku-20240307-v1:0",
    ) => {
        // Create a new Bedrock Runtime client instance.
        const client = new BedrockRuntimeClient({ region: "us-east-1" });

        // Prepare the payload for the model.
        const payload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 1000,
            messages: [
                {
                    role: "user",
                    content: [{ type: "text", text: prompt }],
                },
            ],
        };

        // Invoke Claude with the payload and wait for the API to respond.
        const command = new InvokeModelWithResponseStreamCommand({
            contentType: "application/json",
            body: JSON.stringify(payload),
            modelId,
        });
        const apiResponse = await client.send(command);

        let completeMessage = "";

        // Decode and process the response stream
        for await (const item of apiResponse.body) {
            /** @type Chunk */
            const chunk = JSON.parse(new TextDecoder().decode(item.chunk.bytes));
            const chunk_type = chunk.type;

            if (chunk_type === "content_block_delta") {
                const text = chunk.delta.text;
                completeMessage = completeMessage + text;
                process.stdout.write(text);
            }
        }

        // Return the final response
        return completeMessage;
    };

    const modelId = "anthropic.claude-3-5-sonnet-20240620-v1:0";
    console.log(`Prompt: ${prompt}`);
    console.log(`Model ID: ${modelId}`);

    try {
        console.log("-".repeat(53));
        const response = await invokeModel(prompt, modelId);
        console.log(`Prompt: ${response}`);
        return response;
    } catch (err) {
        return err;
    }
}