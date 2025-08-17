// lib/utils.js
export function formatDate(dateString) {
  // format date nicely
  // example: from this 👉 2025-05-20 to this 👉 May 20, 2025
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatCurrency(
  amount = 0,
  currency = { code: "USD", locale: "en-US", symbol: "$" }
) {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (err) {
    // fallback simple formatter
    return `${currency.symbol}${value.toFixed(2)}`;
  }
}
