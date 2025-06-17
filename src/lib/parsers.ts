export function parseAmount(text: string): {
  currency: string;
  amount: number;
} {
  // Look for total amounts with Gulf currencies
  const totalPatterns = [
    /total\s*:?\s*([£$€]|AED|OMR|KWD|د\.إ|ر\.ع\.|د\.ك)?\s*([0-9]+[.,][0-9]{2,3})/i,
    /amount\s*:?\s*([£$€]|AED|OMR|KWD|د\.إ|ر\.ع\.|د\.ك)?\s*([0-9]+[.,][0-9]{2,3})/i,
    /([£$€]|AED|OMR|KWD|د\.إ|ر\.ع\.|د\.ك)([0-9]+[.,][0-9]{2,3})\s*total/i,
  ];

  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match) {
      let currency = match[1] || "£";
      // Map Arabic symbols to currency codes
      if (currency === "د.إ") currency = "AED";
      if (currency === "ر.ع.") currency = "OMR";
      if (currency === "د.ك") currency = "KWD";

      return {
        currency,
        amount: parseFloat(match[2].replace(",", "")),
      };
    }
  }

  // Fallback to any currency amount
  const anyAmount = text.match(
    /([£$€]|AED|OMR|KWD|د\.إ|ر\.ع\.|د\.ك)([0-9]+[.,][0-9]{2,3})/
  );
  if (anyAmount) {
    let currency = anyAmount[1];
    // Map Arabic symbols to currency codes
    if (currency === "د.إ") currency = "AED";
    if (currency === "ر.ع.") currency = "OMR";
    if (currency === "د.ك") currency = "KWD";

    return {
      currency,
      amount: parseFloat(anyAmount[2].replace(",", "")),
    };
  }

  return { currency: "£", amount: 0 };
}
