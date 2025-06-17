export function parseDate(text: string): Date | null {
  const patterns = [
    /(\d{2}[\-/]\d{2}[\-/]\d{2,4})/,
    /(\d{4}[\-/]\d{2}[\-/]\d{2})/,
    /(\d{1,2}\s+\w+\s+\d{4})/
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
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  for (const line of lines) {
    const low = line.toLowerCase();
    if (low.includes('receipt') || low.includes('invoice')) continue;
    if (/[a-zA-Z]/.test(line) && line.length > 2) return line;
  }
  return '';
}

export function parseAmount(text: string): { currency: string; amount: number } {
  const totalMatch = text.match(/total\s*:?\s*([£$€]|[A-Z]{3})?\s*([0-9]+[.,][0-9]{2})/i);
  if (totalMatch) {
    return {
      currency: totalMatch[1] || '£',
      amount: parseFloat(totalMatch[2].replace(',', ''))
    };
  }
  
  const numberMatches = text.match(/([0-9]+[.,][0-9]{2})/g);
  if (numberMatches) {
    return {
      currency: '£',
      amount: parseFloat(numberMatches[numberMatches.length - 1].replace(',', ''))
    };
  }
  
  return { currency: '£', amount: 0 };
}

export function categorizeExpense(text: string): string {
  const categories = {
    'Flight': ['air', 'flight', 'airline', 'aviation'],
    'Train/Tube': ['train', 'tube', 'metro', 'rail', 'underground'],
    'Taxi': ['taxi', 'uber', 'lyft', 'cab'],
    'Car Hire/Fuel': ['fuel', 'petrol', 'rental', 'car hire', 'gas station'],
    'Hotel': ['hotel', 'inn', 'resort', 'accommodation', 'lodge'],
    'Subsistence': ['meal', 'lunch', 'dinner', 'breakfast', 'restaurant', 'food', 'cafe']
  };
  
  const lowText = text.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowText.includes(keyword))) {
      return category;
    }
  }
  return 'Other';
}