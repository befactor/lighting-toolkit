// أفكار إضاءة بالذكاء الاصطناعي: يرفع صورة المكان ويطلب اقتراحات من api/suggest-lighting.js

const roomImageInput = document.getElementById("roomImageInput");
const imagePreviewWrap = document.getElementById("imagePreviewWrap");
const imagePreview = document.getElementById("imagePreview");
const roomNote = document.getElementById("roomNote");
const getSuggestionsBtn = document.getElementById("getSuggestionsBtn");
const statusMsg = document.getElementById("statusMsg");
const resultBody = document.getElementById("resultBody");

let selectedImageBase64 = null;
let selectedMediaType = null;

roomImageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  selectedMediaType = file.type || "image/jpeg";

  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUrl = ev.target.result;
    selectedImageBase64 = dataUrl.split(",")[1]; // نشيل بادئة data:image/...;base64,
    imagePreview.src = dataUrl;
    imagePreviewWrap.classList.remove("hidden");
    getSuggestionsBtn.disabled = false;
    statusMsg.textContent = "";
  };
  reader.readAsDataURL(file);
});

getSuggestionsBtn.addEventListener("click", async () => {
  if (!selectedImageBase64) return;

  getSuggestionsBtn.disabled = true;
  statusMsg.textContent = "جاري تحليل الصورة… ممكن ياخذ كم ثانية.";
  resultBody.innerHTML = `<p style="color:var(--text-dim)">⏳ بنستنى رد الذكاء الاصطناعي...</p>`;

  try {
    const response = await fetch("/api/suggest-lighting", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        imageBase64: selectedImageBase64,
        mediaType: selectedMediaType,
        roomNote: roomNote.value.trim()
      })
    });

    const data = await response.json();

    if (!response.ok) {
      renderError(data.error || "صار في خطأ غير متوقع.");
      return;
    }

    if (data.needs_better_photo) {
      renderNeedsBetterPhoto(data);
    } else {
      renderSuggestions(data);
    }
  } catch (err) {
    renderError("ما قدرنا نتواصل مع السيرفر. تأكد من اتصال الإنترنت وحاول مرة ثانية.");
  } finally {
    getSuggestionsBtn.disabled = false;
    statusMsg.textContent = "";
  }
});

function renderError(message) {
  resultBody.innerHTML = `
    <div class="card" style="background:var(--bg-soft); border-color:var(--bad); padding:14px 16px;">
      <p style="margin:0; color:var(--bad); font-size:.9rem;">⚠️ ${message}</p>
    </div>
  `;
}

function renderNeedsBetterPhoto(data) {
  resultBody.innerHTML = `
    <div class="card" style="background:var(--bg-soft); border-color:var(--bad); padding:14px 16px; margin-bottom:14px;">
      <p style="margin:0 0 8px; color:var(--bad); font-weight:700; font-size:.92rem;">⚠️ الصورة مو مناسبة كفاية</p>
      <p style="margin:0 0 10px; font-size:.88rem; color:var(--text-dim);">${data.reason || ""}</p>
      <p style="margin:0; font-size:.88rem;">${data.suggestion || "جرب ترفع صورة أوضح للمكان."}</p>
    </div>
    <p style="color:var(--text-dim); font-size:.85rem;">ارفع صورة جديدة من الأعلى وجرب مرة ثانية.</p>
  `;
}

function renderSuggestions(data) {
  const items = (data.suggestions || []).map(s => {
    const p = PRODUCTS.find(p => p.id === s.product_id);
    return `
      <li class="marker-item" style="align-items:flex-start;">
        <div class="marker-badge" style="margin-top:2px;">💡</div>
        <div class="info">
          <div class="name">${p ? p.name : s.product_id}</div>
          <div class="meta">${p ? `${p.category} · ${p.wattage} واط · ${p.colorTemp} · $${p.price}` : ""}</div>
          <div style="font-size:.85rem; margin-top:6px;"><strong>مكان التركيب:</strong> ${s.placement || ""}</div>
          <div style="font-size:.85rem; color:var(--text-dim); margin-top:4px;">${s.reason || ""}</div>
        </div>
      </li>
    `;
  }).join("");

  resultBody.innerHTML = `
    <div class="card" style="background:var(--bg-soft); padding:14px 16px; margin-bottom:16px;">
      <p style="margin:0; font-size:.9rem;">${data.room_description || ""}</p>
    </div>

    <ul class="marker-list" style="max-height:none;">${items}</ul>

    ${data.notes ? `<p style="color:var(--text-dim); font-size:.85rem; margin-top:14px;">${data.notes}</p>` : ""}
  `;
}
