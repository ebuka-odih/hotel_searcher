import { GoogleGenAI } from "@google/genai";
import { HotelResult, VerificationRun } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateMockResults(run: VerificationRun): Promise<HotelResult[]> {
  // In a real app, this would be the browser agent logic.
  // Here we use Gemini to "hallucinate" realistic verified results based on the query
  // to make the demo feel real.
  
  const prompt = `Generate 5 realistic hotel search results for ${run.city} from ${run.checkIn} to ${run.checkOut}.
  Guests: ${run.guests.adults} adults, ${run.guests.children} children.
  Budget: ${run.budget.min}-${run.budget.max} per night.
  Amenities: ${run.amenities.join(', ')}.
  Sites requested: ${run.sites.join(', ')}.
  
  Return a JSON array of objects matching this interface:
  interface HotelResult {
    id: string;
    name: string;
    site: 'Booking.com' | 'Expedia' | 'Agoda' | 'Hotels.com';
    status: 'verified' | 'unclear' | 'unavailable';
    totalPrice: number;
    currency: string;
    priceBreakdown: string;
    cancellationPolicy: string;
    location: string;
    rating: number;
    verifiedAt: string;
    bookingUrl: string;
    evidence: {
      steps: { action: string; timestamp: string }[];
      rawJson: any;
      notes: string;
    };
  }
  
  Make some 'verified', some 'unclear'. Ensure prices are realistic for the city.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating results:", error);
    return [];
  }
}
