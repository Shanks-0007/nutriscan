import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from '@google/genai';

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please check your environment variables.');
  }
  return new GoogleGenAI({ apiKey });
};

export interface NutritionData {
  productName: string;
  brand: string;
  servingSize: string;
  calories: number;
  sugar: number;
  fat: number;
  saturatedFat: number;
  sodium: number;
  carbohydrates: number;
  fiber: number;
  protein: number;
  ingredients: string[];
  healthScore: number;
  category: 'Healthy' | 'Moderate' | 'Risky' | 'Unhealthy';
  uiLabel: 'Healthy' | 'Occasionally' | 'Risky' | 'Avoid';
  nutrientScores: {
    calories: number;
    sugar: number;
    sodium: number;
    fat: number;
    fiber: number;
    protein: number;
  };
  scoreBreakdown: string;
  recommendation: string;
  positives: string[];
  negatives: string[];
  frequency: string;
  maxIntake: string;
  caffeine?: string;
  recommendedFrequency: 'Avoid' | 'Occasionally' | 'Regular';
  frequencyReason: string;
  whoShouldBeCareful: string[];
  healthierAlternatives: string[];
}

export const getHealthCategory = (score: number): { category: NutritionData['category'], uiLabel: NutritionData['uiLabel'] } => {
  if (score >= 80) return { category: 'Healthy', uiLabel: 'Healthy' };
  if (score >= 60) return { category: 'Moderate', uiLabel: 'Occasionally' };
  if (score >= 40) return { category: 'Risky', uiLabel: 'Risky' };
  return { category: 'Unhealthy', uiLabel: 'Avoid' };
};

export interface ProductInfo {
  productName: string;
  brand: string;
}

export const extractProductInfo = async (
  base64Image: string,
  mimeType: string
): Promise<ProductInfo> => {
  const ai = getAI();
  const prompt = `
    Identify the product name and brand name from this nutrition label or product packaging image.
    Be as accurate as possible.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING },
            brand: { type: Type.STRING }
          },
          required: ['productName', 'brand']
        }
      },
    });

    const text = response.text;
    if (!text) {
      const finishReason = response.candidates?.[0]?.finishReason;
      console.error('Gemini response empty for extractProductInfo', { finishReason, response });
      throw new Error(`Failed to identify product: Empty response from AI (Reason: ${finishReason || 'Unknown'})`);
    }
    return JSON.parse(text) as ProductInfo;
  } catch (error: any) {
    console.error('Error in extractProductInfo:', error);
    throw new Error(`Failed to identify product: ${error.message || 'Unknown error'}`);
  }
};

export const analyzeNutritionLabel = async (
  base64Image: string,
  mimeType: string,
  dietPreference?: string,
  healthGoal?: string,
  userProfile?: any
): Promise<NutritionData> => {
  const ai = getAI();
  const prompt = `
    Perform a deep analysis of this nutrition label image. 
    1. Identify the product name and brand.
    2. Locate the "Nutrition Facts" table.
    3. Extract values for: Serving Size, Calories, Total Fat, Saturated Fat, Sodium, Total Carbohydrates, Dietary Fiber, Total Sugars, and Protein.
    4. Extract the list of ingredients as an array of strings.
    5. Identify if the product contains caffeine.
    
    CRITICAL INSTRUCTIONS:
    - DO NOT default to 0 for everything. Look closely at the text.
    - If a value is not explicitly visible but you can identify the product (e.g., "Coca-Cola Classic"), use your internal knowledge to provide the standard nutritional values for that product.
    - If you absolutely cannot find a value and cannot identify the product, only then use a reasonable estimate based on similar food items.
    - If the image is blurry or low quality, do your absolute best to infer the values from context and product identification.
    
    HEALTH EVALUATION REPORT SECTIONS:
    1. Recommended Frequency: Classify as 'Avoid', 'Occasionally', or 'Regular'.
    2. Frequency Reason: A short, specific reason explaining why.
    3. Positives: List good nutritional aspects.
    4. Concerns (Negatives): List health risks with specific numbers.
    5. Who Should Be Careful: Targeted user groups. 
    6. Healthier Alternatives: Suggest specific better options.

    SCORING LOGIC:
    - Calories: 0-100 kcal (100 pts), 100-200 (80 pts), 200-300 (60 pts), 300-400 (40 pts), 400+ (20 pts)
    - Sugar: 0-5g (100 pts), 5-10g (80 pts), 10-20g (60 pts), 20-30g (40 pts), 30+ (20 pts)
    - Sodium: 0-100mg (100 pts), 100-300mg (80 pts), 300-600mg (60 pts), 600-1000mg (40 pts), 1000+ (20 pts)
    - Fat: 0-5g (100 pts), 5-10g (80 pts), 10-20g (60 pts), 20-30g (40 pts), 30+ (20 pts)
    - Fiber: 0-1g (20 pts), 1-3g (60 pts), 3-5g (80 pts), 5+ (100 pts)
    - Protein: 0-2g (20 pts), 2-5g (60 pts), 5-10g (80 pts), 10+ (100 pts)

    Calculate the Final Health Score (0–100) using a strict weighted formula based on nutritional values.
    Final Health Score = (0.25 × Calories Score) + (0.25 × Sugar Score) + (0.20 × Sodium Score) + (0.15 × Fat Score) + (0.10 × Fiber Score) + (0.05 × Protein Score)

    User Context for Scoring:
    - Diet Preference: ${dietPreference || 'None'}
    - Health Goal: ${healthGoal || 'None'}
    - Profile: ${JSON.stringify(userProfile || {})}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING },
            brand: { type: Type.STRING },
            servingSize: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            sugar: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            saturatedFat: { type: Type.NUMBER },
            sodium: { type: Type.NUMBER },
            carbohydrates: { type: Type.NUMBER },
            fiber: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            healthScore: { type: Type.NUMBER },
            category: { type: Type.STRING, enum: ['Healthy', 'Moderate', 'Risky', 'Unhealthy'] },
            uiLabel: { type: Type.STRING, enum: ['Healthy', 'Occasionally', 'Risky', 'Avoid'] },
            nutrientScores: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.NUMBER },
                sugar: { type: Type.NUMBER },
                sodium: { type: Type.NUMBER },
                fat: { type: Type.NUMBER },
                fiber: { type: Type.NUMBER },
                protein: { type: Type.NUMBER }
              },
              required: ['calories', 'sugar', 'sodium', 'fat', 'fiber', 'protein']
            },
            scoreBreakdown: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            positives: { type: Type.ARRAY, items: { type: Type.STRING } },
            negatives: { type: Type.ARRAY, items: { type: Type.STRING } },
            frequency: { type: Type.STRING },
            maxIntake: { type: Type.STRING },
            caffeine: { type: Type.STRING },
            recommendedFrequency: { type: Type.STRING, enum: ['Avoid', 'Occasionally', 'Regular'] },
            frequencyReason: { type: Type.STRING },
            whoShouldBeCareful: { type: Type.ARRAY, items: { type: Type.STRING } },
            healthierAlternatives: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: [
            'productName', 'brand', 'servingSize', 'calories', 'sugar', 'fat', 'saturatedFat',
            'sodium', 'carbohydrates', 'fiber', 'protein', 'ingredients', 'healthScore', 
            'category', 'uiLabel', 'nutrientScores', 'scoreBreakdown', 'recommendation', 'positives', 'negatives', 
            'frequency', 'maxIntake', 'recommendedFrequency', 'frequencyReason',
            'whoShouldBeCareful', 'healthierAlternatives'
          ]
        }
      },
    });

    const text = response.text;
    if (!text) {
      const finishReason = response.candidates?.[0]?.finishReason;
      console.error('Gemini response empty for analyzeNutritionLabel', { finishReason, response });
      throw new Error(`Failed to generate analysis: Empty response from AI (Reason: ${finishReason || 'Unknown'})`);
    }
    
    const data = JSON.parse(text) as NutritionData;

    // Enforce strict category mapping based on score to ensure consistency
    const { category, uiLabel } = getHealthCategory(data.healthScore);
    data.category = category;
    data.uiLabel = uiLabel;

    return data;
  } catch (error: any) {
    console.error('Error in analyzeNutritionLabel:', error);
    throw new Error(`Failed to generate analysis: ${error.message || 'Unknown error'}`);
  }
};
