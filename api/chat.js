import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  const message = req.body.message;
  
  try {
    // Groq দিয়ে ট্রাই করো
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: message }],
      model: 'llama-3.1-70b-versatile',
    });
    
    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    // Groq ব্যান হলে Gemini দিয়ে ট্রাই করো
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(message);
    res.json({ reply: result.response.text() });
  }
}
