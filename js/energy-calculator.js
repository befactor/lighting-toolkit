// حاسبة توفير الطاقة: قبل مقابل بعد (أي نوعين إنارة)
// كل شي حسابات رياضية بسيطة، ما في اتصال إنترنت مطلوب.

function fmt(num, digits = 2) {
  if (!isFinite(num)) return "—";
  return num.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

function calculate() {
  const currency = document.getElementById("currency").value.trim() || "$";
  const count = Number(document.getElementById("unitCount").value) || 0;
  const oldWatt = Number(document.getElementById("oldWatt").value) || 0;
  const newWatt = Number(document.getElementById("newWatt").value) || 0;
  const hours = Number(document.getElementById("hoursPerDay").value) || 0;
  const price = Number(document.getElementById("pricePerKwh").value) || 0;
  const ledUnitPrice = Number(document.getElementById("ledUnitPrice").value) || 0;
  const installCost = Number(document.getElementById("installCost").value) || 0;

  const oldDailyKwh = (oldWatt * count / 1000) * hours;
  const newDailyKwh = (newWatt * count / 1000) * hours;
  const savedDailyKwh = Math.max(oldDailyKwh - newDailyKwh, 0);

  const savedDailyCost = savedDailyKwh * price;
  const savedMonthlyCost = savedDailyCost * 30;
  const savedYearlyCost = savedDailyCost * 365;

  const investment = ledUnitPrice * count + installCost;
  const paybackMonths = savedMonthlyCost > 0 ? investment / savedMonthlyCost : Infinity;

  const savingsPercent = oldDailyKwh > 0 ? (savedDailyKwh / oldDailyKwh) * 100 : 0;

  // جدول تراكمي لـ 5 سنين
  const years = [1, 2, 3, 4, 5].map(y => {
    const cumulativeSavings = savedYearlyCost * y;
    const net = cumulativeSavings - investment;
    return { year: y, cumulativeSavings, net };
  });

  renderResults({
    currency, oldDailyKwh, newDailyKwh, savedDailyCost, savedMonthlyCost,
    savedYearlyCost, investment, paybackMonths, savingsPercent, years
  });
}

function renderResults(r) {
  const c = r.currency;
  const paybackText = isFinite(r.paybackMonths)
    ? (r.paybackMonths < 1 ? "أقل من شهر" : `${fmt(r.paybackMonths, 1)} شهر`)
    : "لا يوجد توفير كافٍ لحساب الاسترداد";

  const maxKwh = Math.max(r.oldDailyKwh, r.newDailyKwh, 0.0001);
  const oldPct = (r.oldDailyKwh / maxKwh) * 100;
  const newPct = (r.newDailyKwh / maxKwh) * 100;

  const rowsHtml = r.years.map(y => `
    <tr>
      <td>سنة ${y.year}</td>
      <td>${c}${fmt(y.cumulativeSavings)}</td>
      <td class="${y.net >= 0 ? 'good' : 'bad'}" style="color:${y.net >= 0 ? 'var(--good)' : 'var(--bad)'}">
        ${y.net >= 0 ? '+' : ''}${c}${fmt(y.net)}
      </td>
    </tr>
  `).join("");

  document.getElementById("resultsBody").innerHTML = `
    <div class="stat-row">
      <div class="stat">
        <div class="label">نسبة التوفير بالاستهلاك</div>
        <div class="value good">${fmt(r.savingsPercent, 1)}%</div>
      </div>
      <div class="stat">
        <div class="label">توفير شهري</div>
        <div class="value good">${c}${fmt(r.savedMonthlyCost)}</div>
      </div>
      <div class="stat">
        <div class="label">توفير سنوي</div>
        <div class="value good">${c}${fmt(r.savedYearlyCost)}</div>
      </div>
    </div>

    <div class="compare-bar">
      <div class="bar-label"><span>الاستهلاك اليومي الحالي</span><span>${fmt(r.oldDailyKwh)} kWh</span></div>
      <div class="bar-track"><div class="bar-fill old" style="width:${oldPct}%"></div></div>
    </div>
    <div class="compare-bar">
      <div class="bar-label"><span>الاستهلاك اليومي بالوحدة الجديدة</span><span>${fmt(r.newDailyKwh)} kWh</span></div>
      <div class="bar-track"><div class="bar-fill new" style="width:${newPct}%"></div></div>
    </div>

    <div class="stat-row" style="grid-template-columns:1fr 1fr;">
      <div class="stat">
        <div class="label">إجمالي تكلفة الاستثمار (وحدات جديدة + تركيب)</div>
        <div class="value">${c}${fmt(r.investment)}</div>
      </div>
      <div class="stat">
        <div class="label">فترة استرداد رأس المال</div>
        <div class="value">${paybackText}</div>
      </div>
    </div>

    <h3 style="margin-top:20px;">التوفير التراكمي على 5 سنين</h3>
    <table class="simple">
      <thead><tr><th>السنة</th><th>توفير تراكمي</th><th>صافي الربح بعد خصم الاستثمار</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;
}

document.getElementById("calcBtn").addEventListener("click", calculate);
document.getElementById("printBtn").addEventListener("click", () => window.print());

// احسب مرة عند فتح الصفحة بالقيم الافتراضية
calculate();
