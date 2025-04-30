// chatbot.js
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

async function askChatGPT(message) {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo', 
        messages: [
          {
            role: "system",
            content: "You are an IoT assistant. Only answer questions about IoT devices, sensors, lights, fans, etc.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenRouter Chat Error:', error.response?.data || error.message);
    throw new Error('ChatGPT request failed');
  }
}

module.exports = askChatGPT;
