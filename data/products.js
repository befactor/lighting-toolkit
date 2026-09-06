/*
  كتالوج المنتجات — عدّل هالقائمة براحتك بمنتجاتك الحقيقية.
  كل منتج له:
    id            رقم/رمز فريد (ما تكرره)
    name          اسم المنتج
    category      واحدة من: "داخلي" | "خارجي" | "مسبح" | "ديكوري"
    wattage       القدرة بالواط
    colorTemp     درجة حرارة اللون (مثال: "3000K دافئ")
    price         السعر (بعملتك المحلية)
*/

const PRODUCTS = [
  { id: "in-01", name: "سبوت داخلي مدفون LED", category: "داخلي", wattage: 7, colorTemp: "3000K دافئ", price: 6 },
  { id: "in-02", name: "أباجورة سقف معلقة", category: "داخلي", wattage: 12, colorTemp: "4000K طبيعي", price: 22 },
  { id: "in-03", name: "شريط LED للديكور الداخلي", category: "داخلي", wattage: 14, colorTemp: "قابل للتغيير", price: 15 },

  { id: "out-01", name: "كشاف حائطي خارجي", category: "خارجي", wattage: 20, colorTemp: "4000K طبيعي", price: 18 },
  { id: "out-02", name: "عمود إنارة حديقة", category: "خارجي", wattage: 30, colorTemp: "3000K دافئ", price: 45 },
  { id: "out-03", name: "كشاف أرضي مدفون (Uplight)", category: "خارجي", wattage: 9, colorTemp: "3000K دافئ", price: 20 },

  { id: "pool-01", name: "كشاف تحت الماء LED", category: "مسبح", wattage: 18, colorTemp: "RGB متعدد الألوان", price: 55 },
  { id: "pool-02", name: "إنارة محيطية لحافة المسبح", category: "مسبح", wattage: 10, colorTemp: "4000K طبيعي", price: 28 },

  { id: "dec-01", name: "شريط إضاءة ديكوري ملون", category: "ديكوري", wattage: 8, colorTemp: "RGB متعدد الألوان", price: 12 },
  { id: "dec-02", name: "كشاف نجفة ديكورية", category: "ديكوري", wattage: 40, colorTemp: "3000K دافئ", price: 90 }
];

// يسمح لسيرفرلس فنكشن (api/suggest-lighting.js) تستخدم نفس القائمة عن طريق require()
if (typeof module !== "undefined" && module.exports) {
  module.exports = PRODUCTS;
}
