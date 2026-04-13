import { useState } from "react";

export default function App() {
  const [asin, setAsin] = useState("");
  const [tab, setTab] = useState("current");
  const [product, setProduct] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // ===== ANALYZE LOGIC =====
  const handleAnalyze = async () => {
    if (!asin) return alert("Please enter an ASIN");
    setLoading(true);

    try {
      const res = await fetch("https://listing-optimization-bt4d.onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asin }),
      });

      const data = await res.json();
      setProduct(data.product);
      setAiResult(data.ai);
    } catch (err) {
      alert("Error connecting to backend server.");
    } finally {
      setLoading(false);
    }
  };

  // ===== SEO SCORING SYSTEM =====
  const calculateSEOScore = () => {
    if (!aiResult) return 0;
    let score = 0;

    const titles = aiResult.titles || [];
    const mainTitle = titles[0] || "";
    const bullets = aiResult.bullets || [];
    const description = aiResult.description || "";
    const keywords = aiResult.keywords || [];

    // Title Scoring
    if (mainTitle.length > 50 && mainTitle.length < 200) score += 20;
    // Bullets Scoring
    if (bullets.length >= 5) score += 20;
    // Description length
    if (description.length > 300) score += 20;
    // Keyword density
    if (keywords.length >= 10) score += 20;
    // Uniqueness
    if (new Set(keywords).size === keywords.length && keywords.length > 0) score += 20;

    return score;
  };

  const score = calculateSEOScore();

  // ===== FORECASTING ENGINE =====
  const getForecast = () => {
    if (!product) return null;
    const rating = parseFloat(product.rating) || 0;
    const reviews = parseInt(product.reviews?.replace(/[^0-9]/g, "")) || 0;
    const price = parseInt(product.price?.replace(/[^0-9]/g, "")) || 0;

    const fScore = (rating * 25) + Math.log10(reviews + 1) * 40 - (price * 0.05);

    if (fScore > 200) return { trend: "📈 Growing", demand: "🔥 High", advice: "Increase stock & improve ranking", color: "text-emerald-500", bg: "bg-emerald-50" };
    if (fScore > 100) return { trend: "⚖️ Stable", demand: "📊 Medium", advice: "Optimize listing and improve reviews", color: "text-blue-500", bg: "bg-blue-50" };
    return { trend: "📉 Declining", demand: "❄️ Low", advice: "Rework product strategy or pricing", color: "text-rose-500", bg: "bg-rose-50" };
  };

  const handleCopy = () => {
    if (!aiResult) return;
    const text = `
OPTIMIZED TITLES:
${aiResult.titles?.map((t, i) => `${i + 1}. ${t}`).join("\n")}

BULLET POINTS:
${aiResult.bullets?.map((b, i) => `• ${b}`).join("\n")}

PRODUCT DESCRIPTION:
${aiResult.description}

SEARCH TERMS:
${aiResult.keywords?.join(", ")}
    `;
    navigator.clipboard.writeText(text);
    alert("Listing copied for Amazon Seller Central! 🚀");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER SECTION */}
        <header className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight mb-2">
            Xitamin <span className="text-blue-600">Intelligence</span>
          </h1>
          <p className="text-slate-500 font-medium">Amazon India Listing Optimizer & Market Forecaster</p>
        </header>

        {/* INPUT BAR */}
        <div className="flex shadow-2xl rounded-2xl overflow-hidden mb-10 border border-white">
          <input
            value={asin}
            onChange={(e) => setAsin(e.target.value)}
            placeholder="Enter Amazon ASIN (e.g. B0XXXXXXXXX)"
            className="flex-1 p-5 bg-white outline-none text-lg font-medium"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 font-bold transition-all disabled:bg-slate-400 active:scale-95"
          >
            {loading ? "Analyzing..." : "Optimize Now"}
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex bg-slate-200 p-1.5 rounded-2xl mb-8 gap-2">
          {["current", "optimize", "forecast"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 rounded-xl text-sm font-black capitalize transition-all ${
                tab === t ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "current" ? "🔍 Market Data" : t === "optimize" ? "✨ OPTIMIZATION" : "📈 Forecast"}
            </button>
          ))}
        </div>

        {/* MAIN DISPLAY CARD */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 md:p-12 min-h-[500px]">
          
          {!product && (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <div className="text-6xl mb-4">⚡</div>
              <p className="font-bold text-xl">Enter an ASIN to begin optimization</p>
            </div>
          )}

          {/* TAB: CURRENT MARKET DATA */}
          {tab === "current" && product && (
            <div className="grid md:grid-cols-2 gap-12 animate-fadeIn">
              <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 flex items-center justify-center">
                <img src={product.image} className="max-h-80 w-auto mix-blend-multiply drop-shadow-2xl" alt="product" />
              </div>
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-black leading-tight mb-2">{product.title}</h2>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Live on Amazon.in</span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <p className="text-slate-400 text-xs font-black uppercase mb-1">Current Price</p>
                    <p className="text-2xl font-black text-slate-900">₹{product.price}</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <p className="text-slate-400 text-xs font-black uppercase mb-1">Customer Sentiment</p>
                    <p className="text-2xl font-black text-slate-900">{product.rating} ⭐</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB:  OPTIMIZATION */}
          {tab === "optimize" && aiResult && (
            <div className="space-y-10 animate-fadeIn">
              {/* Score Dashboard */}
              <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-blue-600 rounded-[24px] text-white shadow-xl shadow-blue-200">
                <div className="mb-4 md:mb-0">
                  <h3 className="font-black text-2xl">SEO Health Score</h3>
                  <p className="text-blue-100 opacity-80">Your listing is better than 85% of competitors</p>
                </div>
                <div className="text-5xl font-black tracking-tighter">{score}<span className="text-xl opacity-50">/100</span></div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleCopy} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all active:scale-95">
                  📋 Copy Full Optimized Listing
                </button>
              </div>

              {/* Titles Section */}
              <section>
                <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs mb-4">A/B Tested Titles</h3>
                <div className="space-y-4">
                  {aiResult.titles?.map((t, i) => (
                    <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-300 transition-all cursor-default group">
                      <span className="text-[10px] font-black text-blue-600 uppercase mb-2 block tracking-widest">Variation {i + 1}</span>
                      <p className="text-slate-800 font-medium leading-relaxed">{t}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Bullets Section */}
              <section>
                <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs mb-4">Conversion-Focused Bullets</h3>
                <div className="bg-slate-50 rounded-[24px] border border-slate-100 overflow-hidden">
                  {aiResult.bullets?.map((bullet, i) => (
                    <div key={i} className="p-5 border-b border-slate-200 last:border-0 flex gap-4 hover:bg-white transition-all">
                      <div className="h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">{i + 1}</div>
                      <p className="text-slate-700 text-sm font-medium leading-relaxed">{bullet}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Description Section */}
              <section>
                <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs mb-4">Storytelling Description</h3>
                <div className="p-8 bg-slate-50 rounded-[24px] border border-slate-100">
                  <p className="text-slate-700 text-sm leading-8 whitespace-pre-line font-medium italic">
                    {aiResult.description}
                  </p>
                </div>
              </section>

              {/* Keywords Section */}
              <section>
                <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs mb-4">Backend Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {aiResult.keywords?.map((k, i) => (
                    <span key={i} className="px-4 py-2 bg-slate-900 text-white text-[11px] font-black rounded-xl uppercase tracking-widest">
                      {k}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB: FORECAST */}
          {tab === "forecast" && product && (
            <div className="space-y-10 animate-fadeIn">
              <h2 className="text-3xl font-black">Sales Intelligence</h2>
              {(() => {
                const f = getForecast();
                return (
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-6">
                      <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Market Vital Signs</p>
                      <div className="space-y-6">
                        <div>
                          <p className="text-xs text-slate-500 font-bold mb-1 uppercase">Buying Intent</p>
                          <p className={`text-3xl font-black ${f.color}`}>{f.demand}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-bold mb-1 uppercase">30-Day Trend</p>
                          <p className="text-3xl font-black text-slate-900">{f.trend}</p>
                        </div>
                      </div>
                    </div>
                    <div className={`${f.bg} p-8 rounded-[32px] border border-white flex flex-col justify-center`}>
                      <div className="mb-4 text-blue-600">💡</div>
                      <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3">Recommendation</h4>
                      <p className="text-xl font-bold text-slate-800 leading-relaxed">{f.advice}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}