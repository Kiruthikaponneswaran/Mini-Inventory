const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export const formatPrice = (price: string | number) => currency.format(Number(price));
export const formatDate = (iso: string) => date.format(new Date(iso));
