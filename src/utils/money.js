export function money(cents, currency = "PKR") {
  const n = (Number(cents) || 0) / 100;
  return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function shortDate(iso) {
  return new Date(iso).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function errorText(err, fallback = "Something went wrong. Please try again.") {
  const map = {
    duplicate_name: "That name already exists.",
    invalid_input: "Please check the values you entered.",
    empty_cart: "Add at least one item first.",
    invalid_product: "One of the products is no longer available.",
    invalid_transition: "That change isn't allowed for this order.",
    network: "Can't reach the server. Is the backend running?",
    api_url_missing: "This website is not connected to the server (VITE_API_URL is missing in this build).",
    forbidden: "You don't have permission to do that.",
    table_required: "Choose a table for a dine-in order.",
    table_occupied: "That table already has an open order.",
    insufficient_tender: "The cash received is less than the total.",
    invalid_payment_method: "Choose a payment method.",
    invalid_order_type: "Choose dine-in, takeaway or delivery.",
    cooldown: "Please wait a minute before asking for another code.",
    invalid_or_expired: "That code is wrong or has expired.",
    too_many_attempts: "Too many wrong attempts. Ask for a new code.",
    email_taken: "That email is already registered.",
    invalid_discount: "Discount can't be more than the order subtotal.",
    stock_not_tracked: "Turn on stock tracking for this product first.",
  };
  if (err?.data?.error === "insufficient_stock")
    return `Not enough stock${err.data.product ? ` for ${err.data.product}` : ""} (${err.data.available ?? 0} left).`;
  if (err?.status === 403) return map.forbidden;
  if (err?.message === "Failed to fetch") return map.network;
  if (err?.status >= 500)
    return `Server error (HTTP ${err.status}). Run "python manage.py migrate" and check the backend terminal.`;
  return map[err?.data?.error] || (err?.status ? `${fallback} (${err.data?.error || "HTTP " + err.status})` : fallback);
}
