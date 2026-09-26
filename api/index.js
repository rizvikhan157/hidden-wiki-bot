const { Telegraf } = require('telegraf');
const Groq = require('groq-sdk');
const { GoogleGenAI } = require('@google/genai');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

bot.on('text', async (ctx) => {
  const message = ctx.message.text;

  try {
    // PRIMARY: Groq GPT-OSS 120B
    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    });

    return await ctx.reply(
      completion.choices[0].message.content
    );

  } catch (groqErr) {
    console.error('Groq Error:', groqErr);

    try {
      // FALLBACK: Gemini 3.8 Flash
      const result = await genAI.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: message
      });

      return await ctx.reply(result.text);

    } catch (geminiErr) {
      console.error('Gemini Error:', geminiErr);

      return await ctx.reply(
        `API Execution Failed:\n\n` +
        `Groq: ${groqErr.message}\n\n` +
        `Gemini: ${geminiErr.message}`
      );
    }
  }
});

module.exports = async (req, res) => {
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
};
