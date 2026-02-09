// server.ts
import express from "express";
import bodyParser from "body-parser";
import { askAI } from "./test-ai"; // save your current AI code as ask-ai.ts

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Health check endpoint
app.get("/health", (_req, res) => {
  res.send("Server is running ✅");
});

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: "No message provided" });
    }

    const result = await askAI(userMessage);

    if (!result) {
      return res.status(500).json({ error: "AI failed to respond" });
    }

    res.json({
      reply: result.reply,
      modelUsed: result.modelUsed                           
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
