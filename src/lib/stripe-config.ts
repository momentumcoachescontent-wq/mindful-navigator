// Stripe price and product configuration
// Monthly: $49 MXN/month
// Annual: $499 MXN/year (15% savings)

export const STRIPE_PRICES = {
  monthly: {
    priceId: "price_1St98XGdhRtIc6ULbd4XTTNO",
    productId: "prod_TqqqmkapCQYj7Z",
    price: 49,
    currency: "MXN",
    interval: "month" as const,
    label: "Mensual",
    displayPrice: "$49",
    period: "/mes",
  },
  yearly: {
    priceId: "price_1St9EMGdhRtIc6ULHtvZZEXK",
    productId: "prod_Tqqw6do0wrNNZq",
    price: 499,
    currency: "MXN",
    interval: "year" as const,
    label: "Anual",
    displayPrice: "$499",
    period: "/año",
    savings: "Ahorra 15%",
    popular: true,
  },
} as const;

export type PlanType = keyof typeof STRIPE_PRICES;
