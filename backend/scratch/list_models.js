import dotenv from 'dotenv';
dotenv.config();
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function list() {
  try {
    const list = await groq.models.list();
    console.log("Available Groq Models:", list.data.map(m => m.id));
  } catch (err) {
    console.error(err);
  }
}

list();
