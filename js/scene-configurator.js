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
    drawMarker(m.x, m.y, i + 1);
  });
}

function drawMarker(x, y, number) {
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.fillStyle = "#f5b942";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#1a1305";
  ctx.stroke();

  ctx.fillStyle = "#1a1305";
  ctx.font = "bold 13px Tahoma";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(number, x, y + 1);
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
  const link = document.createElement("a");
  link.download = "مشهد-الإضاءة.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
