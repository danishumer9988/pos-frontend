// All page text lives here. Edit this file, not the components.

export const BRAND = "Tillo"; // EDIT: your real product name
export const TRIAL_NOTE = "Free for 14 days. No card needed."; // EDIT: only keep if true

// --- Onboarding (additions only — Landing continues to use `TYPES` above) ---
export const SUPER_CATEGORIES = [
  { id: "food-hospitality", label: "Food & Hospitality", active: true },
];

export const BUSINESS_TYPES = [
  { id: "restaurant-cafe", superCategoryId: "food-hospitality", label: "Restaurant & Café" },
  { id: "fast-food", superCategoryId: "food-hospitality", label: "Fast Food Outlet" },
  { id: "bakery", superCategoryId: "food-hospitality", label: "Bakery & Confectionery" },
  { id: "juice-beverage", superCategoryId: "food-hospitality", label: "Juice, Smoothie & Beverage Shop" },
  { id: "ice-cream", superCategoryId: "food-hospitality", label: "Ice Cream & Dessert Shop" },
  { id: "catering", superCategoryId: "food-hospitality", label: "Catering Service" },
  { id: "food-truck", superCategoryId: "food-hospitality", label: "Food Truck & Takeaway Outlet" },
];

export const TYPES = [
  "Restaurants & cafés",
  "Fast-food outlets",
  "Bakeries & confectioneries",
  "Juice, smoothie & beverage shops",
  "Ice cream & dessert shops",
  "Food trucks & takeaway",
  "Catering services",
];

export const FEATURES = [
  { title: "Fast sales screen", text: "Tap items, add extras, take payment. Built for a busy counter." },
  { title: "Menu with sizes and add-ons", text: "Set up drinks, meals and combos once. Change prices in seconds." },
  { title: "Daily reports", text: "See today's sales, best sellers and each cashier's total." },
  { title: "Works offline", text: "Keep selling when the internet drops. Sales sync when it returns.", soon: true },
];

export const STEPS = [
  { title: "Sign up", text: "Create your account and verify your email." },
  { title: "Set up your shop", text: "Choose your business type and add your store details." },
  { title: "Start selling", text: "Add your menu and make your first sale from the dashboard." },
];

// EDIT: placeholder prices. Set real ones after talking to shop owners.
export const PLANS = [
  { name: "Starter", price: "15", note: "For one counter", features: ["1 register", "Menu and sales screen", "Daily reports"] },
  { name: "Growth", price: "35", note: "For busy shops", features: ["3 registers", "Staff roles", "Stock tracking", "Priority support"], featured: true },
  { name: "Multi-shop", price: "75", note: "For small chains", features: ["Unlimited registers", "Multiple locations", "Combined reports"] },
];

// EDIT: keep only promises you can really keep.
export const TRUST = [
  { title: "Your data stays yours", text: "Each shop's sales and menu are kept separate from every other shop." },
  { title: "Export anytime", text: "Download your sales records whenever you need them." },
  { title: "Support from a person", text: "Message us when something breaks during service." },
];

export const FAQS = [
  { q: "Does it work without internet?", a: "Offline selling is planned and not available yet. We will tell you when it is ready." },
  { q: "Which printers and scanners work?", a: "We start with browser printing. Thermal receipt printer and barcode scanner support is planned." },
  { q: "Can I take card payments?", a: "At first you record card payments as a payment type. Built-in card processing comes later." },
  { q: "Can I use it on a tablet or phone?", a: "Yes. It runs in the browser on a tablet, phone or computer." },
  { q: "Can I cancel anytime?", a: "Yes. There is no long contract." }, // EDIT: only if true
];

export const PREVIEW_ITEMS = [
  ["Latte", "4.50"], ["Cappuccino", "4.00"], ["Iced tea", "3.00"],
  ["Muffin", "3.25"], ["Croissant", "3.50"], ["Water", "1.00"],
];
