export async function convertToGBP(amount: number, fromCurrency: string): Promise<number> {
  try {
    if (fromCurrency === 'GBP' || fromCurrency === '£') return amount;
    
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
    );
    const data = await response.json();
    
    const gbpRate = data.rates.GBP;
    return amount * gbpRate;
  } catch (error) {
    console.error('Currency conversion error:', error);
    return amount; // Return original amount if conversion fails
  }
}