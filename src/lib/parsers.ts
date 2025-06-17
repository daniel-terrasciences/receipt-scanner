export function parseDate(text: string): Date | null {
  const patterns = [
    /(\d{2}[\-/]\d{2}[\-/]\d{4})/, // DD/MM/YYYY
    /(\d{4}[\-/]\d{2}[\-/]\d{2})/, // YYYY/MM/DD
    /(\d{1,2}\s+\w+\s+\d{4})/, // 15 Jun 2025
    /(\d{1,2}[\-/]\d{1,2}[\-/]\d{2})/, // DD/MM/YY
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const date = new Date(match[1]);
      if (!isNaN(date.getTime())) return date;
    }
  }
  return null;
}

export function parseProvider(text: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);

  // Skip common receipt header words
  const skipWords = [
    "receipt",
    "invoice",
    "tax",
    "vat",
    "till",
    "terminal",
    "transaction",
  ];

  for (const line of lines) {
    const low = line.toLowerCase();
    if (skipWords.some((word) => low.includes(word))) continue;
    if (line.length > 2 && /[a-zA-Z]/.test(line) && !line.match(/^\d+$/)) {
      return line;
    }
  }
  return "";
}

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

export function categorizeExpense(text: string): string {
  const categories = {
    Flight: ["air", "flight", "airline", "aviation"],
    "Train/Tube": ["train", "tube", "metro", "rail", "underground"],
    Taxi: ["taxi", "uber", "lyft", "cab"],
    "Car Hire/Fuel": ["fuel", "petrol", "rental", "car hire", "gas station"],
    Hotel: ["hotel", "inn", "resort", "accommodation", "lodge"],
    Subsistence: [
      "meal",
      "lunch",
      "dinner",
      "breakfast",
      "restaurant",
      "food",
      "cafe",
    ],
  };

  const lowText = text.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => lowText.includes(keyword))) {
      return category;
    }
  }
  return "Other";
}
