import config from '../config/index.js';

function ruleRecommendation(product, averageDemand) {
  const low = product.stockLevel < product.reorderThreshold;
  const spike = product.demandVelocity > averageDemand * 2;
  const direction = low || spike ? 'INCREASE' : 'HOLD';
  const price = direction === 'HOLD'
    ? product.currentPrice
    : product.currentPrice * (low ? 1.1 : 1.05);

  return {
    recommendedPrice: Math.round(price * 100) / 100,
    direction,
    pricingConfidence: low ? 0.86 : spike ? 0.78 : 0.68,
    pricingReasoning: low
      ? 'Stock is below its reorder threshold. Increase price modestly to protect scarce inventory while replenishment is arranged.'
      : spike
        ? 'Demand velocity is over twice the category average. Increase price modestly to capture exceptional demand.'
        : 'Inventory and demand are stable, so hold the current price.',
    recommendedQuantity: Math.max(1, product.reorderThreshold * 3 - product.stockLevel),
    reorderConfidence: 0.82,
    reorderReasoning: 'Order enough stock to reach three reorder-threshold cycles and protect against ongoing demand.',
  };
}

function promptFor(product, averageDemand, triggerReason) {
  return `You are the commerce advisor for an online retailer. Return only a JSON object, without markdown.\nTrigger: ${triggerReason}\nProduct: ${product.name}; category ${product.category}; currentPrice ${product.currentPrice}; stockLevel ${product.stockLevel}; reorderThreshold ${product.reorderThreshold}; demandVelocityLast24h ${product.demandVelocity}; categoryAverageDemandVelocity ${averageDemand.toFixed(2)}.\nConstraints: recommendedPrice must be positive and within 0.5x-2x current price; direction must be INCREASE, DECREASE, or HOLD (HOLD means price exactly equals currentPrice); recommendedQuantity must be a positive integer; confidence values must be 0-1; both reasoning values must be concise and non-empty.\nRequired JSON shape: {"recommendedPrice":29.99,"direction":"INCREASE","pricingConfidence":0.82,"pricingReasoning":"...","recommendedQuantity":40,"reorderConfidence":0.78,"reorderReasoning":"..."}`;
}

async function requestGroq(prompt) {
  if (!config.groqApiKey) throw new Error('GROQ_API_KEY is not configured');
  const response = await fetch(`${config.groqBaseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.groqModel,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.error?.message || response.statusText;
    throw new Error(`Groq API returned ${response.status}: ${message}`);
  }
  const content = body.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Groq response did not include message content');
  }
  return content;
}

async function requestGemini(prompt) {
  if (!config.geminiApiKey) throw new Error('GEMINI_API_KEY is not configured');
  const url = `${config.geminiBaseUrl}/models/${encodeURIComponent(config.geminiModel)}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': config.geminiApiKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.error?.message || response.statusText;
    throw new Error(`Gemini API returned ${response.status}: ${message}`);
  }
  const content = body.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('');
  if (typeof content !== 'string' || !content.trim()) {
    const reason = body.promptFeedback?.blockReason || body.candidates?.[0]?.finishReason;
    throw new Error(`Gemini response did not include text${reason ? ` (${reason})` : ''}`);
  }
  return content;
}

function parseRecommendation(raw, product) {
  const json = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const result = JSON.parse(json);
  const price = Number(result.recommendedPrice);
  const direction = String(result.direction || '').toUpperCase();
  const quantity = Number(result.recommendedQuantity);
  const comparison = Math.abs(price - product.currentPrice) < 0.005
    ? 0
    : price > product.currentPrice ? 1 : -1;

  if (!Number.isFinite(price) || price < product.currentPrice * 0.5 || price > product.currentPrice * 2) {
    throw new Error('AI price is outside the permitted 0.5x-2x range');
  }
  if (!['INCREASE', 'DECREASE', 'HOLD'].includes(direction)
    || (direction === 'HOLD' && comparison !== 0)
    || (direction === 'INCREASE' && comparison !== 1)
    || (direction === 'DECREASE' && comparison !== -1)) {
    throw new Error('AI price direction does not match its recommended price');
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('AI recommended quantity must be a positive integer');
  }
  for (const field of ['pricingConfidence', 'reorderConfidence']) {
    if (!Number.isFinite(Number(result[field])) || Number(result[field]) < 0 || Number(result[field]) > 1) {
      throw new Error(`AI ${field} must be between 0 and 1`);
    }
  }
  for (const field of ['pricingReasoning', 'reorderReasoning']) {
    if (typeof result[field] !== 'string' || !result[field].trim()) {
      throw new Error(`AI ${field} must not be empty`);
    }
  }

  return {
    ...result,
    recommendedPrice: Math.round(price * 100) / 100,
    direction,
    pricingConfidence: Number(result.pricingConfidence),
    reorderConfidence: Number(result.reorderConfidence),
  };
}

async function aiRecommendation(product, averageDemand, triggerReason) {
  const prompt = promptFor(product, averageDemand, triggerReason);
  let raw;

  if (config.llmProvider === 'groq') raw = await requestGroq(prompt);
  else if (config.llmProvider === 'gemini') raw = await requestGemini(prompt);
  else throw new Error(`Unsupported LLM_PROVIDER: ${config.llmProvider}`);

  return parseRecommendation(raw, product);
}

async function recommend(product, averageDemand, triggerReason, strategy) {
  if (strategy !== 'ai') return ruleRecommendation(product, averageDemand);
  try {
    return await aiRecommendation(product, averageDemand, triggerReason);
  } catch (error) {
    console.warn(`${config.llmProvider} advisor failed; using rules: ${error.message}`);
    return ruleRecommendation(product, averageDemand);
  }
}

export { recommend, ruleRecommendation };
