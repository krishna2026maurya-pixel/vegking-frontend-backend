/**
 * Helper to extract proposed/countered rate from free-form chat messages.
 * Matches patterns like:
 * - "no it will be 60/kg"
 * - "60/kg"
 * - "rate 60"
 * - "₹60"
 * - "Rs. 60"
 * - "60 rs"
 * - "can do 60"
 * - "final 60"
 * - "60"
 */
export function extractPriceFromMessage(text: string | undefined | null): number | null {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.trim();
  if (!cleaned) return null;

  const patterns = [
    // Symbol before number: ₹60, Rs. 60, Rs 60, INR 60
    /(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)/i,
    // Number with unit/currency after: 60/kg, 60/-, 60rs, 60 per kg
    /(\d+(?:\.\d+)?)\s*(?:\/kg|\/-\s*|rs|₹|per\s*kg)/i,
    // Keywords indicating rate/price: "rate is 60", "price 60", "it will be 60", "offer 60", "final 60", "give 60"
    /(?:rate|price|offer|give|do|final|be)\s*(?:is|at|for|be)?\s*₹?\s*(\d+(?:\.\d+)?)/i,
    // "at 60", "for 60"
    /(?:at|for)\s*₹?\s*(\d+(?:\.\d+)?)(?:\s*(?:rs|\/kg|each))?/i,
    // "60 kg" or "60/kg" at start/middle
    /(?:^|\s)(\d+(?:\.\d+)?)\s*(?:kg|\/kg)/i,
    // Pure number alone in message
    /^\s*(\d+(?:\.\d+)?)\s*$/,
  ];

  for (const regex of patterns) {
    const m = cleaned.match(regex);
    if (m && m[1]) {
      const val = parseFloat(m[1]);
      if (val > 0 && val < 1000000) {
        return Math.round(val * 100) / 100;
      }
    }
  }

  return null;
}

/**
 * Determine the effective agreed or latest counter price in a negotiation session
 * by checking latest messages backwards for proposed_price or extracted price,
 * then falling back to current_counter_price, initial_offer_price, and original_price.
 */
export function getNegotiatedPrice(session: any, messages: any[] = []): number {
  if (!session) return 0;

  // 1. Scan messages from newest to oldest
  if (Array.isArray(messages) && messages.length > 0) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m && m.proposed_price && Number(m.proposed_price) > 0) {
        return Number(m.proposed_price);
      }
      if (m && m.message) {
        const extracted = extractPriceFromMessage(m.message);
        if (extracted && extracted > 0) {
          return extracted;
        }
      }
    }
  }

  // 2. Check session.final_agreed_price if already accepted
  if (session.final_agreed_price && Number(session.final_agreed_price) > 0) {
    return Number(session.final_agreed_price);
  }

  // 3. Check session.current_counter_price
  if (session.current_counter_price && Number(session.current_counter_price) > 0) {
    return Number(session.current_counter_price);
  }

  // 4. Fall back to initial_offer_price or original_price
  return Number(session.initial_offer_price || session.original_price || 0);
}
