const { Telegraf } = require('telegraf');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function pickProvider(text) {
  const t = text.toLowerCase();
  if (t.length > 1200 || t.includes('step by step') || t.includes('analyze')) return 'groq';
  return 'gemini';
}

async function askGemini(userText) {
  const model = gemini.getGenerativeModel({ model: 'gemini-3.5-flash' });
  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: userText }]
      }
    ]
  });
  return result.response.text();
}

async function askGroq(userText) {
  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      {
        role: 'system',
        content: 'Answer clearly, directly, and helpfully. Use concise structure when useful.'
      },
      {
        role: 'user',
        content: userText
      }
    ],
    temperature: 0.7,
    max_tokens: 2048
  });

  return completion.choices?.[0]?.message?.content || 'No response.';
}

bot.on('text', async (ctx) => {
  const message = ctx.message.text.trim();

  try {
    const provider = pickProvider(message);
    const reply = provider === 'groq'
      ? await askGroq(message)
      : await askGemini(message);

    return ctx.reply(reply);
  } catch (err1) {
    try {
      const fallback = provider === 'groq'
        ? await askGemini(message)
        : await askGroq(message);

      return ctx.reply(fallback);
    } catch (err2) {
      return ctx.reply(API error:\n1. ${err1.message}\n2. ${err2.message});
    }
  }
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      return res.status(200).send('OK');
    } catch (err) {
      return res.status(500).send('Webhook error');
    }
  }

  return res.status(200).send('Bot is active');
};
