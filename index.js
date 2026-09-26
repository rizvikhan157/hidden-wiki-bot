import { Telegraf } from 'telegraf';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const bot = new Telegraf(process.env.BOT_TOKEN);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

bot.on('text', async (ctx) => {
  const message = ctx.message.text;
  
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: message }],
      model: 'llama-3.1-70b-versatile',
    });
    ctx.reply(completion.choices[0].message.content);
  } catch (error) {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(message);
    ctx.reply(result.response.text());
  }
});

bot.launch();
