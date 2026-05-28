export interface CalcInputs {
    purchasePrice: number;     // per KG
    quantity: number;
  
    localTransport: number;
    customsClearance: number;
    miscCharges: number;
  
    oceanFreight: number;
    marineInsurance: number;
  
    profitPct: number;
  
    usdRate: number;
    aedRate: number;
  
    // optional advanced
    targetSellingPrice?: number; // per KG (optional)
  }
  
  export interface CalcResults {
    productCost: number;
    originCost: number;
  
    fobBase: number;
    profitAmount: number;
    fobTotal: number;
  
    cifTotal: number;
  
    fobPerKg: number;
    cifPerKg: number;
  
    fobUSD: number;
    cifUSD: number;
  
    fobAED: number;
    cifAED: number;
  
    totalFOBValue: number;
    totalCIFValue: number;
  
    marginStatus: "LOSS" | "LOW" | "SAFE" | "HIGH";
  
    suggestedProfitPct?: number;
    isCIF: boolean;
  }
  
  export function calculateExportPrice(input: CalcInputs): CalcResults {
    const {
      purchasePrice,
      quantity,
      localTransport,
      customsClearance,
      miscCharges,
      oceanFreight,
      marineInsurance,
      profitPct,
      usdRate,
      aedRate,
      targetSellingPrice
    } = input;
  
    // 1. Product Cost
    const productCost = purchasePrice * quantity;
  
    // 2. Origin Cost
    const originCost = localTransport + customsClearance + miscCharges;
  
    // 3. FOB
    const fobBase = productCost + originCost;
    const profitAmount = fobBase * (profitPct / 100);
    const fobTotal = fobBase + profitAmount;
  
    // 4. CIF (NO EXTRA PROFIT)
    const cifTotal = fobTotal + oceanFreight + marineInsurance;
  
    // 5. Per KG
    const fobPerKg = fobTotal / quantity;
    const cifPerKg = cifTotal / quantity;
  
    // 6. Currency
    const fobUSD = fobPerKg / usdRate;
    const cifUSD = cifPerKg / usdRate;
  
    const fobAED = fobPerKg / aedRate;
    const cifAED = cifPerKg / aedRate;
  
    // 7. Margin Safety Indicator
    let marginStatus: CalcResults["marginStatus"] = "SAFE";
  
    if (profitPct <= 0) marginStatus = "LOSS";
    else if (profitPct < 5) marginStatus = "LOW";
    else if (profitPct <= 15) marginStatus = "SAFE";
    else marginStatus = "HIGH";
  
    // 8. Suggested Profit % (if target selling price given)
    let suggestedProfitPct: number | undefined;
  
    if (targetSellingPrice && targetSellingPrice > 0) {
      const targetTotal = targetSellingPrice * quantity;
      suggestedProfitPct = ((targetTotal - fobBase) / fobBase) * 100;
    }
  
    return {
      productCost,
      originCost,
  
      fobBase,
      profitAmount,
      fobTotal,
  
      cifTotal,
  
      fobPerKg,
      cifPerKg,
  
      fobUSD,
      cifUSD,
  
      fobAED,
      cifAED,
  
      totalFOBValue: fobTotal,
      totalCIFValue: cifTotal,
  
      marginStatus,
      suggestedProfitPct,
  
      isCIF: oceanFreight > 0 || marineInsurance > 0
    };
  }