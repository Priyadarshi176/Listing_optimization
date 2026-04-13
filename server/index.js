console.log("🔥 NEW CODE DEPLOYED");

import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// ===============================
// RETRY FUNCTION
// ===============================
async function retryWithBackoff(fn, retries = 3, delay = 2000) {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;

    console.log("🔁 Retrying Gemini...");
    await new Promise(res => setTimeout(res, delay));

    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

// ===============================
// GEMINI FUNCTION
// ===============================
async function generateWithGemini(title, description) {
  if (!genAI) {
    return {
      titles: ["API key missing"],
      bullets: ["Check GEMINI_API_KEY"],
      description: "AI not configured.",
      keywords: [],
    };
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // ✅ FIXED
  });

  const prompt = `
Act as an E-commerce SEO Specialist. Return ONLY JSON.

Title: ${title}
Description: ${description}

{
  "titles": ["...", "..."],
  "bullets": ["...", "..."],
  "description": "...",
  "keywords": ["...", "..."]
}
`;

  try {
    const result = await retryWithBackoff(() =>
      model.generateContent(prompt)
    );

    const text = result.response.text();

    const cleanText = text.replace(/```json|```/g, "").trim();

    return JSON.parse(cleanText);

  } catch (err) {
    console.log("❌ Gemini Error:", err.message);

    return {
      titles: ["Error generating"],
      bullets: ["Try again"],
      description: "AI failed",
      keywords: [],
    };
  }
}

// ===============================
// ROUTES
// ===============================
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.post("/api/analyze", async (req, res) => {
  const { asin } = req.body;

  if (!asin) {
    return res.status(400).json({ error: "ASIN required" });
  }

  try {
    const url = `https://www.amazon.in/dp/${asin}`;

    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Language": "en-IN,en;q=0.9",
        "Connection": "keep-alive",
      },
    });

    const $ = cheerio.load(data);

    const title = $("#productTitle").text().trim();
    const description =
      $("#feature-bullets").text().trim() ||
      $("#productDescription").text().trim();

    const price = $(".a-price-whole").first().text().trim();
    const rating = $(".a-icon-alt").first().text().trim();
    const reviews = $("#acrCustomerReviewText").text().trim();
    const image =
      $("#landingImage").attr("data-old-hires") ||
      $("#landingImage").attr("src");

    const aiResult = await generateWithGemini(title, description);

    res.json({
      product: { title, description, price, rating, reviews, image },
      ai: aiResult,
    });

  } catch (error) {
    console.error("❌ ERROR:", error.message);

    res.status(500).json({
      error: "Amazon blocked OR server error",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
