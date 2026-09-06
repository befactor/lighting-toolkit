// سيرفرلس فنكشن (يشتغل تلقائياً على Vercel) — يستقبل صورة غرفة ويرجع اقتراحات إضاءة
// من كتالوج المنتجات باستخدام Claude API.
//
// لازم تضبط متغير بيئة اسمه ANTHROPIC_API_KEY من لوحة تحكم Vercel:
// Project Settings -> Environment Variables -> ANTHROPIC_API_KEY -> قيمة المفتاح
// (المفتاح ما بينكتب هون بالكود أبداً، هيك يضل سري.)

const PRODUCTS = require("../data/products.js");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "الطريقة غير مدعومة." });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "ANTHROPIC_API_KEY غير مضبوط على السيرفر. ضيفه من إعدادات المشروع على Vercel."
    });
    return;
  }

  const { imageBase64, mediaType, roomNote } = req.body || {};
  if (!imageBase64) {
    res.status(400).json({ error: "لم يتم إرسال صورة." });
    return;
  }

  const catalogText = PRODUCTS.map(p =>
    `- ${p.id}: ${p.name} | الفئة: ${p.category} | القدرة: ${p.wattage} واط | درجة اللون: ${p.colorTemp} | السعر: $${p.price}`
  ).join("\n");

  const prompt = `أنت خبير تصميم إضاءة داخلية وخارجية بخبرة 10 سنين. هذه صورة مكان أرسلها زبون لشركة إنارة. كتالوج المنتجات المتوفر عند الشركة (اقترح من هاي القائمة فقط):
${catalogText}

مهمتك بالضبط:
1. إذا كانت الصورة غير واضحة، مظلمة جداً، مقصوصة بشكل يمنع رؤية المكان، أو لا تظهر المساحة بشكل كافٍ لاقتراح إضاءة — رجّع JSON بهاي الصيغة بالضبط:
{"needs_better_photo": true, "reason": "سبب قصير بالعربي ليش الصورة مو مناسبة", "suggestion": "طلب واضح ومحدد للزبون بالعربي، مثل زاوية تصوير أو إضاءة أفضل وقت التصوير"}

2. إذا كانت الصورة مناسبة — اقترح من 2 إلى 4 منتجات بالضبط من الكتالوج أعلاه (استخدم id بالضبط متل ما هو مكتوب)، ورجّع JSON بهاي الصيغة بالضبط:
{"needs_better_photo": false, "room_description": "وصف قصير بالعربي لما تراه بالصورة (نوع المكان، الحجم التقريبي، الإضاءة الحالية)", "suggestions": [{"product_id": "id من الكتالوج", "placement": "وصف مكان التركيب المقترح بالعربي", "reason": "ليش هالمنتج مناسب لهاد المكان بالعربي"}], "notes": "ملاحظة عامة اختيارية بالعربي، أو نص فاضي"}

مهم جداً: جاوب بـ JSON صالح فقط، بدون أي نص أو شرح قبله أو بعده.${roomNote ? `\n\nملاحظة إضافية من الزبون/البائع: ${roomNote}` : ""}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType || "image/jpeg", data: imageBase64 }
              },
              { type: "text", text: prompt }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const details = await response.text();
      res.status(502).json({ error: "فشل الاتصال بخدمة الذكاء الاصطناعي.", details });
      return;
    }

    const data = await response.json();
    const textBlock = (data.content || []).find(b => b.type === "text");

    let parsed;
    try {
      parsed = JSON.parse(textBlock ? textBlock.text : "{}");
    } catch (e) {
      res.status(502).json({ error: "رد غير متوقع من الذكاء الاصطناعي، جرب مرة ثانية." });
      return;
    }

    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: "خطأ بالسيرفر: " + err.message });
  }
};
