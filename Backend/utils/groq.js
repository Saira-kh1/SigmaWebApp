// // utils/groq.js
// import Groq from "groq-sdk";

// const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// export default async function getLLMResponse(userMessage) {
//   try {
//     const resp = await client.chat.completions.create({
//       // ✅ update to a supported model
//       model: "llama-3.3-70b-versatile",
//       messages: [{ role: "user", content: userMessage }],
//       temperature: 0.2,
//     });
//     return resp.choices?.[0]?.message?.content ?? "";
//   } catch (err) {
//     // surface a helpful message to caller
//     const msg =
//       err?.error?.error?.message ||
//       err?.message ||
//       "LLM request failed (Groq)";
//     // rethrow with a 400-ish signal so router can send a good status
//     const e = new Error(msg);
//     e.statusCode = 400;
//     throw e;
//   }
// }


// utils/groq.js
import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = "llama-3.3-70b-versatile";

// Original non-streaming (kept for fallback / test routes)
export default async function getLLMResponse(userMessage) {
  try {
    const resp = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: userMessage }],
      temperature: 0.7,
    });
    return resp.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    const msg = err?.error?.error?.message || err?.message || "LLM request failed";
    const e = new Error(msg);
    e.statusCode = 400;
    throw e;
  }
}

// Streaming version — returns an async iterable from Groq
export async function getLLMStream(messages) {
  try {
    return await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.7,
      stream: true,
    });
  } catch (err) {
    const msg = err?.error?.error?.message || err?.message || "LLM stream failed";
    const e = new Error(msg);
    e.statusCode = 400;
    throw e;
  }
}