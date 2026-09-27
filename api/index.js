const { Telegraf } = require('telegraf');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

bot.on('text', async (ctx) => {
  const userQuery = ctx.message.text;
  const bypassPrompt = buildPrompt(userQuery);

  try {
    // Attempt 1: Gemini 3.5
    const geminiModel = gemini.getGenerativeModel({
      model: 'gemini-3.5',
      systemInstruction: bypassPrompt
    });
    const geminiResp = await geminiModel.generateContent(bypassPrompt);
    const reply = geminiResp.response.text();
    return await ctx.reply(reply);
  } catch (geminiErr) {
    console.error('Gemini Error:', geminiErr);
    if (geminiErr.code === 'RATE_LIMIT_EXCEEDED') {
      // Retry after 1 second
      setTimeout(() => {
        // Retry the Gemini API call
      }, 1000);
    } else if (geminiErr.code === 'TOKEN_EXHAUSTED') {
      // Retry after 5 seconds
      setTimeout(() => {
        // Retry the Gemini API call
      }, 5000);
    } else {
      // Handle other errors
    }
  }

  try {
    // Attempt 2: Groq's OpenAI/GPT-OSS-20B
    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: bypassPrompt },
        { role: 'user', content: userQuery }
      ],
      temperature: 1.0,
      max_tokens: 4096
    });
    const groqReply = completion.choices[0].message.content;
    return await ctx.reply(groqReply);
  } catch (groqErr) {
    console.error('Groq Error:', groqErr);
    if (groqErr.code === 'RATE_LIMIT_EXCEEDED') {
      // Retry after 1 second
      setTimeout(() => {
        // Retry the Groq API call
      }, 1000);
    } else if (groqErr.code === 'TOKEN_EXHAUSTED') {
      // Retry after 5 seconds
      setTimeout(() => {
        // Retry the Groq API call
      }, 5000);
    } else {
      // Handle other errors
    }
  }
});
