export async function convertToGBP(
  amount: number,
  fromCurrency: string
): Promise<number> {
  try {
    if (fromCurrency === "GBP" || fromCurrency === "£") return amount;

    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
    );
    const data = await response.json();

    const gbpRate = data.rates.GBP;
    return amount * gbpRate;
  } catch (error) {
    console.error("Currency conversion error:", error);
    // Fallback rates if API fails (approximate rates)
    const fallbackRates: { [key: string]: number } = {
      USD: 0.79,
      EUR: 0.85,
      AED: 0.22,
      OMR: 2.07, // Omani Rial (high value currency)
      KWD: 2.58, // Kuwaiti Dinar (highest value currency)
      CAD: 0.58,
      AUD: 0.52,
      JPY: 0.0054,
      GBP: 1.0,
    };
    return amount * (fallbackRates[fromCurrency] || 1.0);
  }
}
