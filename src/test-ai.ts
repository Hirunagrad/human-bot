import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const HF_TOKEN = process.env.HF_TOKEN;
const API_URL = "https://router.huggingface.co/v1/chat/completions";

// List of models to try in order. 
// These are the "Heavy Hitters" most likely to be online for free.
const MODELS_TO_TRY = [
  "Qwen/Qwen2.5-72B-Instruct",       // Current best free model
  "meta-llama/Llama-3.2-3B-Instruct", // Very fast backup
  "microsoft/Phi-3.5-mini-instruct"   // Ultra-lightweight backup
];

async function askAI(text: string) {
  for (const model of MODELS_TO_TRY) {
    console.log(`\n🤖 Trying model: ${model}...`);
    
    try {
      const response = await axios.post(
        API_URL,
        {
          model: model,
          messages: [
            { 
              role: "system", 
              content: "You are a friendly human bookstore assistant. Reply naturally." 
            },
            { 
              role: "user", 
              content: text 
            }
          ],
          max_tokens: 100,
          temperature: 0.7
        },
        {
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      // If we get here, it worked! Return the answer.
      return { 
        modelUsed: model, 
        reply: response.data.choices[0].message.content 
      };

    } catch (error: any) {
      // Only log the status code to keep output clean
      const status = error.response ? error.response.status : "Unknown";
      console.log(`❌ Failed with status ${status}. Switching to next model...`);
    }
  }
  return null;
}

(async () => {
  const result = await askAI("Hello, do you have Harry Potter in stock?");
  
  if (result) {
    console.log("\n✅ SUCCESS!");
    console.log(`Model: ${result.modelUsed}`);
    console.log("--------------------------------------------------");
    console.log(result.reply);
  } else {
    console.error("\n💀 All models failed. Check your Token or Internet connection.");
  }
})();