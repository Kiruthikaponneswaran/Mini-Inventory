const currency = new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" });
const date = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Dubai",
});

export const formatPrice = (price: string | number) => currency.format(Number(price));
export const formatDate = (iso: string) => date.format(new Date(iso));