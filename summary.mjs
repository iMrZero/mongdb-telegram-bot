import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({
  apiKey:
    process.env.GEMINI_API_KEY || "AIzaSyDhUSgSdsn4_uSxu49sYaymUF5wkHq9Kk0",
});
// summarizeText();
export async function summarize(text) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Summarize the following text in a clear and concise way:\n ${text} \n Provide a concise summary of the main points`,
  });
  return response.text;
}
