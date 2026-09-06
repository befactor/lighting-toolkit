// سيرفرلس فنكشن (Vercel) — ياخذ صورة غرفة + مواصفات إضاءة (لون، قدرة، لومن)
// ويرجع نفس الصورة بعد إضافة تأثير إضاءة واقعي، باستخدام OpenAI Image Edit API.
//
// لازم تضبط متغير بيئة اسمه OPENAI_API_KEY من لوحة تحكم Vercel:
// Project Settings -> Environment Variables -> OPENAI_API_KEY -> قيمة المفتاح من platform.openai.com

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "الطريقة غير مدعومة." });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "OPENAI_API_KEY غير مضبوط على السيرفر. ضيفه من إعدادات المشروع على Vercel."
    });
    return;
  }

  const { imageBase64, mediaType, lightType, colorTemp, wattage, lumens, notes } = req.body || {};
  if (!imageBase64) {
    res.status(400).json({ error: "لم يتم إرسال صورة." });
    return;
  }

  const promptText = `Using the provided photo of a room, add realistic ${lightType || "recessed ceiling spotlights and hidden cove lighting"} illumination effects. The light color temperature is ${colorTemp || "3000K warm white"}, each fixture is approximately ${wattage || 7} watts producing about ${lumens || 600} lumens — keep the glow soft and realistic, not overexposed, matching that brightness level. Preserve the room's exact structure, walls, floor, window, furniture, and camera angle exactly as in the original photo — only add the lighting effect itself (the fixtures' glow, soft light pools on surfaces, warm color cast on nearby walls/ceiling). Make the result photorealistic, like a real estate photo taken with the lights turned on at dusk.${notes ? ` Additional note: ${notes}` : ""}`;

  try {
    const imageBuffer = Buffer.from(imageBase64, "base64");
    const imageBlob = new Blob([imageBuffer], { type: mediaType || "image/jpeg" });

    const form = new FormData();
    form.append("image", imageBlob, "room.jpg");
    form.append("prompt", promptText);
    form.append("model", "gpt-image-1");
    form.append("size", "auto");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form
    });

    if (!response.ok) {
      const details = await response.text();
      res.status(502).json({ error: "فشل الاتصال بخدمة توليد الصور.", details });
      return;
    }

    const data = await response.json();
    const b64 = data?.data?.[0]?.b64_json;

    if (!b64) {
      res.status(502).json({ error: "ما رجعت خدمة الصور صورة صالحة، جرب مرة ثانية.", details: JSON.stringify(data).slice(0, 500) });
      return;
    }

    res.status(200).json({ imageBase64: b64, mediaType: "image/png" });
  } catch (err) {
    res.status(500).json({ error: "خطأ بالسيرفر: " + err.message });
  }
};
