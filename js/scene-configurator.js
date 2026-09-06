// مصمم مشهد الإضاءة: رفع صورة + وضع كشافات عليها من الكتالوج

const canvas = document.getElementById("sceneCanvas");
const ctx = canvas.getContext("2d");
const emptyHint = document.getElementById("emptyHint");
const imageInput = document.getElementById("imageInput");
const markerListEl = document.getElementById("markerList");
const totalPriceEl = document.getElementById("totalPrice");

const productModal = document.getElementById("productModal");
const categorySelect = document.getElementById("categorySelect");
const productSelect = document.getElementById("productSelect");
const productPreview = document.getElementById("productPreview");

let bgImage = null;
let markers = []; // { x, y, productId }
let pendingPoint = null; // النقطة الحالية اللي بننتظر نختار لها منتج

function currency() { return "$"; }

// ---------- تحميل الصورة ----------
imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      bgImage = img;
      markers = [];
      const maxWidth = 760;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.classList.remove("hidden");
      emptyHint.classList.add("hidden");
      drawScene();
      renderMarkerList();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// ---------- الرسم ----------
function drawScene() {
  if (!bgImage) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

  markers.forEach((m, i) => {
    const p = PRODUCTS.find(p => p.id === m.productId);
    drawMarker(ctx, m.x, m.y, i + 1, p ? p.wattage : 0);
  });
}

// أضعف/أقوى قدرة موجودة بالكتالوج، تستخدم لتحجيم شدة التوهج نسبياً
function wattageRange() {
  const watts = PRODUCTS.map(p => p.wattage);
  return { min: Math.min(...watts), max: Math.max(...watts) };
}

function drawMarker(targetCtx, x, y, number, wattage) {
  // شدة التوهج بتتحدد حسب قدرة الكشاف (واط) نسبة لباقي الكتالوج
  const { min, max } = wattageRange();
  const t = max > min ? Math.min(Math.max((wattage - min) / (max - min), 0), 1) : 0.5;
  const glowRadius = 16 + t * 30;   // 16 إلى 46 بكسل
  const glowAlpha = 0.35 + t * 0.4; // 0.35 إلى 0.75

  // هالة توهج ناعمة حوالين الكشاف، متل ضوء حقيقي — حجمها وشدتها حسب قدرة الوحدة
  const glow = targetCtx.createRadialGradient(x, y, 2, x, y, glowRadius);
  glow.addColorStop(0, `rgba(255,207,107,${glowAlpha})`);
  glow.addColorStop(1, "rgba(255,207,107,0)");
  targetCtx.beginPath();
  targetCtx.arc(x, y, glowRadius, 0, Math.PI * 2);
  targetCtx.fillStyle = glow;
  targetCtx.fill();

  // جسم الكشاف بتدرّج لوني
  const pinGradient = targetCtx.createRadialGradient(x - 4, y - 4, 2, x, y, 14);
  pinGradient.addColorStop(0, "#ffe1a0");
  pinGradient.addColorStop(1, "#f5b942");
  targetCtx.beginPath();
  targetCtx.arc(x, y, 13, 0, Math.PI * 2);
  targetCtx.fillStyle = pinGradient;
  targetCtx.fill();
  targetCtx.lineWidth = 2;
  targetCtx.strokeStyle = "#1a1305";
  targetCtx.stroke();

  targetCtx.fillStyle = "#1a1305";
  targetCtx.font = "bold 13px Tahoma";
  targetCtx.textAlign = "center";
  targetCtx.textBaseline = "middle";
  targetCtx.fillText(number, x, y + 1);
}

// ---------- التفاعل بالنقر ----------
canvas.addEventListener("click", (e) => {
  if (!bgImage) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  pendingPoint = { x, y };
  openProductModal();
});

// ---------- المودال ----------
function categories() {
  return [...new Set(PRODUCTS.map(p => p.category))];
}

function openProductModal() {
  categorySelect.innerHTML = categories()
    .map(c => `<option value="${c}">${c}</option>`).join("");
  populateProducts();
  productModal.classList.remove("hidden");
}

function populateProducts() {
  const cat = categorySelect.value || categories()[0];
  const list = PRODUCTS.filter(p => p.category === cat);
  productSelect.innerHTML = list.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  updatePreview();
}

function updatePreview() {
  const p = PRODUCTS.find(p => p.id === productSelect.value);
  if (!p) { productPreview.textContent = ""; return; }
  productPreview.textContent = `القدرة: ${p.wattage} واط · درجة اللون: ${p.colorTemp} · السعر: ${currency()}${p.price}`;
}

categorySelect.addEventListener("change", populateProducts);
productSelect.addEventListener("change", updatePreview);

document.getElementById("confirmMarkerBtn").addEventListener("click", () => {
  const productId = productSelect.value;
  if (pendingPoint && productId) {
    markers.push({ x: pendingPoint.x, y: pendingPoint.y, productId });
    drawScene();
    renderMarkerList();
  }
  closeModal();
});

document.getElementById("cancelMarkerBtn").addEventListener("click", closeModal);

function closeModal() {
  productModal.classList.add("hidden");
  pendingPoint = null;
}

// ---------- قائمة الكشافات + الإجمالي ----------
function renderMarkerList() {
  if (markers.length === 0) {
    markerListEl.innerHTML = `<li style="color:var(--text-dim); font-size:.88rem;">ما في كشافات بعد.</li>`;
    totalPriceEl.textContent = `${currency()}0`;
    return;
  }

  markerListEl.innerHTML = markers.map((m, i) => {
    const p = PRODUCTS.find(p => p.id === m.productId);
    return `
      <li class="marker-item">
        <div class="marker-badge">${i + 1}</div>
        <div class="info">
          <div class="name">${p ? p.name : "منتج محذوف"}</div>
          <div class="meta">${p ? `${p.category} · ${currency()}${p.price}` : ""}</div>
        </div>
        <button class="btn btn-danger" data-index="${i}">حذف</button>
      </li>
    `;
  }).join("");

  markerListEl.querySelectorAll("button[data-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index);
      markers.splice(idx, 1);
      drawScene();
      renderMarkerList();
    });
  });

  const total = markers.reduce((sum, m) => {
    const p = PRODUCTS.find(p => p.id === m.productId);
    return sum + (p ? p.price : 0);
  }, 0);
  totalPriceEl.textContent = `${currency()}${total.toFixed(2)}`;
}

// ---------- أزرار الإجراءات ----------
document.getElementById("clearBtn").addEventListener("click", () => {
  markers = [];
  drawScene();
  renderMarkerList();
});

document.getElementById("printBtn").addEventListener("click", () => window.print());

document.getElementById("exportBtn").addEventListener("click", () => {
  if (!bgImage) return;

  const padding = 20;
  const rowHeight = 44;
  const headerHeight = 50;
  const footerHeight = 44;
  const legendHeight = headerHeight + Math.max(markers.length, 1) * rowHeight + footerHeight;

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height + legendHeight;
  const ex = exportCanvas.getContext("2d");

  // خلفية عامة
  ex.fillStyle = "#14161c";
  ex.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  // الصورة نفسها (فيها الكشافات المتوهجة أصلاً لأنها مرسومة على canvas الأصلي)
  ex.drawImage(canvas, 0, 0);

  // لوحة قائمة المنتجات تحت الصورة
  ex.fillStyle = "#1b1e27";
  ex.fillRect(0, canvas.height, exportCanvas.width, legendHeight);

  ex.direction = "rtl";
  ex.textAlign = "right";
  ex.fillStyle = "#ffcf6b";
  ex.font = "bold 20px Tahoma";
  ex.fillText("عرض إضاءة مقترح — أدوات محمد للإنارة", exportCanvas.width - padding, canvas.height + 32);

  let y = canvas.height + headerHeight;

  if (markers.length === 0) {
    ex.fillStyle = "#9ba0af";
    ex.font = "14px Tahoma";
    ex.fillText("ما في كشافات موضوعة بعد.", exportCanvas.width - padding, y + 20);
    y += rowHeight;
  } else {
    markers.forEach((m, i) => {
      const p = PRODUCTS.find(p => p.id === m.productId);

      // شارة الرقم
      ex.beginPath();
      ex.arc(exportCanvas.width - padding - 12, y + 14, 12, 0, Math.PI * 2);
      ex.fillStyle = "#f5b942";
      ex.fill();
      ex.direction = "ltr";
      ex.textAlign = "center";
      ex.fillStyle = "#1a1305";
      ex.font = "bold 12px Tahoma";
      ex.fillText(i + 1, exportCanvas.width - padding - 12, y + 18);

      // اسم المنتج وتفاصيله
      ex.direction = "rtl";
      ex.textAlign = "right";
      ex.fillStyle = "#edeef2";
      ex.font = "bold 15px Tahoma";
      ex.fillText(p ? p.name : "منتج محذوف", exportCanvas.width - padding - 32, y + 12);

      ex.fillStyle = "#9ba0af";
      ex.font = "12px Tahoma";
      ex.fillText(p ? `${p.category} · ${p.wattage} واط · ${p.colorTemp}` : "", exportCanvas.width - padding - 32, y + 30);

      // السعر على الجهة المقابلة
      ex.direction = "ltr";
      ex.textAlign = "left";
      ex.fillStyle = "#4ade80";
      ex.font = "bold 15px Tahoma";
      ex.fillText(p ? `$${p.price}` : "", padding, y + 18);

      // خط فاصل
      ex.strokeStyle = "#2f3341";
      ex.lineWidth = 1;
      ex.beginPath();
      ex.moveTo(padding, y + rowHeight - 8);
      ex.lineTo(exportCanvas.width - padding, y + rowHeight - 8);
      ex.stroke();

      y += rowHeight;
    });
  }

  const total = markers.reduce((sum, m) => {
    const p = PRODUCTS.find(p => p.id === m.productId);
    return sum + (p ? p.price : 0);
  }, 0);

  ex.direction = "rtl";
  ex.textAlign = "right";
  ex.fillStyle = "#ffcf6b";
  ex.font = "bold 18px Tahoma";
  ex.fillText(`الإجمالي: $${total.toFixed(2)}`, exportCanvas.width - padding, y + 24);

  const link = document.createElement("a");
  link.download = "عرض-إضاءة-مقترح.png";
  link.href = exportCanvas.toDataURL("image/png");
  link.click();
});
