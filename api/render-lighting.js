// سيرفرلس فنكشن (Vercel) — ياخذ صورة غرفة + مواصفات إضاءة (لون، قدرة، لومن)
// ويرجع نفس الصورة بعد إضافة تأثير إضاءة واقعي، باستخدام Gemini API (تعديل صور).
//
// لازم تضبط متغير بيئة اسمه GEMINI_API_KEY من لوحة تحكم Vercel:
// Project Settings -> Environment Variables -> GEMINI_API_KEY -> قيمة المفتاح من aistudio.google.com

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "الطريقة غير مدعومة." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "GEMINI_API_KEY غير مضبوط على السيرفر. ضيفه من إعدادات المشروع على Vercel."
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
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        model: "gemini-3.1-flash-image",
        input: [
          { type: "text", text: promptText },
          { type: "image", mime_type: mediaType || "image/jpeg", data: imageBase64 }
        ],
        response_format: { type: "image", mime_type: "image/jpeg" }
      })
    });

    if (!response.ok) {
      const details = await response.text();
      res.status(502).json({ error: "فشل الاتصال بخدمة توليد الصور.", details });
      return;
    }

    const data = await response.json();

    let outImageData = null;
    let outImageMime = "image/jpeg";

    if (data.output_image && data.output_image.data) {
      outImageData = data.output_image.data;
      outImageMime = data.output_image.mime_type || outImageMime;
    } else if (Array.isArray(data.steps)) {
      for (const step of data.steps) {
        const content = Array.isArray(step.content) ? step.content : [];
        const imgPart = content.find(c => c.type === "image");
        if (imgPart) {
          outImageData = imgPart.data;
          outImageMime = imgPart.mime_type || outImageMime;
          break;
        }
      }
    }

    if (!outImageData) {
      res.status(502).json({ error: "ما رجعت خدمة الصور صورة صالحة، جرب مرة ثانية." });
      return;
    }

    res.status(200).json({ imageBase64: outImageData, mediaType: outImageMime });
  } catch (err) {
    res.status(500).json({ error: "خطأ بالسيرفر: " + err.message });
  }
};
