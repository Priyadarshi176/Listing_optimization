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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ===============================
// ✅ RETRY FUNCTION
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
// ✅ GEMINI FUNCTION (FINAL FIXED)
// ===============================
async function generateWithGemini(title, description) {

  // ⏳ Rate limit safety
  await new Promise(res => setTimeout(res, 12000));

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const prompt = `
Act as an E-commerce SEO Specialist. Your task is to generate a fully optimized product listing.

STRICTLY return ONLY valid JSON. Do NOT include markdown, backticks, or prose.

Input Data:
- Product Title: ${title}
- Product Description: ${description || "NOT PROVIDED - Infer features/benefits from Title"}

Optimization Requirements:
1. Titles (Multiple Options): Provide 3 distinct title variations:
   - Option 1: SEO Focus (Keyword-heavy, max 150 chars).
   - Option 2: Brand/Click-Through Focus (Punchy and readable).
   - Option 3: Technical Focus (Emphasizing specs/dimensions).
2. Bullet Points: 5 high-converting bullets. Start each with an emoji or capitalized benefit.
3. Description: If the input description was missing, generate a high-quality 200-word description based on the product type.
4. Keywords: 10 backend search terms (comma-separated within the array).

Output Schema:
{
  "titles": [
    "SEO Focused Title...",
    "Brand Focused Title...",
    "Technical Focused Title..."
  ],
  "bullets": ["...", "...", "...", "...", "..."],
  "description": "...",
  "keywords": ["...", "..."]
}
`;

  try {
    const result = await retryWithBackoff(() =>
      model.generateContent(prompt)
    );

    const text = result.response.text();

    console.log("🧠 Gemini RAW:", text);

    // 🔥 CLEAN RESPONSE
    let cleanText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanText);

    // ✅ Ensure safe structure (VERY IMPORTANT)
    return {
      titles: Array.isArray(parsed.titles) ? parsed.titles : [],
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
      description: parsed.description || "",
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    };

  } catch (err) {
    console.log("❌ Gemini Error:", err.message);

    // ✅ Always return safe structure (prevents frontend crash)
    return {
      title: "Unable to generate title",
      bullets: ["Try again"],
      description: "AI failed. Please retry.",
      keywords: [],
    };
  }
}

// ===============================
// ✅ MAIN API
// ===============================
app.post("/api/analyze", async (req, res) => {
  const { asin } = req.body;

  if (!asin) {
    return res.status(400).json({ error: "ASIN required" });
  }

  try {
    const url = `https://www.amazon.in/dp/${asin}`;

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-IN,en;q=0.9",
      },
    });

    const $ = cheerio.load(data);

    const title = $("#productTitle").text().trim();

    const description =
      $("#feature-bullets").text().trim() ||
      $("#productDescription").text().trim() ||
      "No description";

    const price =
      $(".a-price-whole").first().text().trim() || "Not available";

    const rating =
      $(".a-icon-alt").first().text().trim() || "No rating";

    const reviews =
      $("#acrCustomerReviewText").text().trim() || "No reviews";

    const image =
      $("#landingImage").attr("data-old-hires") ||
      $("#landingImage").attr("src") ||
      "";

    // 🔥 AI CALL
    const aiResult = await generateWithGemini(title, description);

    res.json({
      product: { title, description, price, rating, reviews, image },
      ai: aiResult,
    });

  } catch (error) {
    console.error("❌ ERROR:", error.message);

    res.status(500).json({
      error: "Failed to fetch product or AI busy. Try again.",
    });
  }
});

// ===============================
const PORT = process.env.PORT || 5000;
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
