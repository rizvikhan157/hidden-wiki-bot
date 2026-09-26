import { Telegraf } from 'telegraf';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

bot.on('text', async (ctx) => {
  const message = ctx.message.text;
  
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: message }],
      model: 'llama-3.1-8b-instant',
    });
    await ctx.reply(completion.choices[0].message.content);
  } catch (error) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(message);
      await ctx.reply(result.response.text());
    } catch (err) {
      console.error('AI Error:', err);
      await ctx.reply('দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না।');
    }
  }
});

// Vercel Serverless Function Handler (Webhook-এর জন্য আবশ্যিক)
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      return res.status(200).send('OK');
    } catch (err) {
      console.error('Webhook Error:', err);
      return res.status(500).send('Error');
    }
  }
  return res.status(200).send('Telegram Bot is active on Vercel!');
}
