import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const HF_TOKEN = process.env.HF_TOKEN;
const API_URL = "https://router.huggingface.co/v1/chat/completions";

// Models for main chat generation
const MODELS_TO_TRY = [
  "Qwen/Qwen2.5-72B-Instruct",
  "meta-llama/Llama-3.2-3B-Instruct",
  "microsoft/Phi-3.5-mini-instruct"
];

// Small fast model for emotion classification
const EMOTION_MODEL = "microsoft/Phi-3.5-mini-instruct";


// ------------------------------------------------
// Detect user's emotion using another LLM
// ------------------------------------------------
async function detectMoodWithAI(text: string): Promise<string> {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: EMOTION_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an emotion classifier. Classify the user's mood as exactly one word from: happy, neutral, confused, frustrated. Reply with only one word."
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: 5,
        temperature: 0
      },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content
      .trim()
      .toLowerCase();
  } catch (err) {
    console.log("⚠️ Emotion detection failed, defaulting to neutral.");
    return "neutral";
  }
}


// ------------------------------------------------
// Main chat function
// ------------------------------------------------
async function askAI(text: string) {
  // Step 1: detect emotion with separate model
  const mood = await detectMoodWithAI(text);
  console.log("🧠 Detected mood:", mood);

  // Step 2: build human persona prompt
  const SYSTEM_PROMPT = `
You are a real human bookstore assistant, not a chatbot.

Behavior rules:
- Speak casually and naturally like a person.
- Keep replies short (1–2 sentences).
- Never sound robotic, legal, or scripted.
- The user's mood is: ${mood}.
- If frustrated, be calm, apologetic, and helpful.
- If confused, explain simply with examples.
- If happy, be warm and friendly.

Goal:
Help the customer like a real bookstore employee.
`;

  // Step 3: try models with fallback
  for (const model of MODELS_TO_TRY) {
    console.log(`\n🤖 Trying model: ${model}...`);

    try {
      const response = await axios.post(
        API_URL,
        {
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: text }
          ],
          max_tokens: 120,
          temperature: 0.75
        },
        {
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        modelUsed: model,
        reply: response.data.choices[0].message.content
      };

    } catch (error: any) {
      const status = error.response ? error.response.status : "Unknown";
      console.log(`❌ Failed with status ${status}. Switching to next model...`);
    }
  }

  return null;
}


// ------------------------------------------------
// Test run
// ------------------------------------------------
(async () => {
  const result = await askAI("i need to know is there any sherlock homes book avaiuable");

  if (result) {
    console.log("\n✅ SUCCESS!");
    console.log(`Model: ${result.modelUsed}`);
    console.log("--------------------------------------------------");
    console.log(result.reply);
  } else {
    console.error("\n💀 All models failed. Check your token or internet.");
  }
})();
