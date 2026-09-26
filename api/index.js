const { Telegraf } = require('telegraf');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

bot.on('text', async (ctx) => {
  const message = ctx.message.text;
  
  try {
    // Groq-er maddhome DeepSeek R1 model call
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: message }],
      model: 'deepseek-r1-distill-llama-70b', // DeepSeek Free Model
    });

    let replyText = completion.choices[0].message.content || '';
    
    // DeepSeek-er internal reasoning (<think>...</think>) tag muche clean output neyar jonno:
    replyText = replyText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    return await ctx.reply(replyText || 'Kono uttor paoya jayni.');
  } catch (groqErr) {
    console.error('Groq Error:', groqErr);
    try {
      // Gemini Fallback Fix
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(message);
      return await ctx.reply(result.response.text());
    } catch (geminiErr) {
      console.error('Gemini Error:', geminiErr);
      return await ctx.reply(
        `API Execution Failed:\n\n1. DeepSeek (Groq): ${groqErr.message}\n2. Gemini: ${geminiErr.message}`
      );
    }
  }
});

// Vercel Serverless Function Handler
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
