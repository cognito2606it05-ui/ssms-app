import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generatePerformanceReport = async (studentName: string, grades: any[]) => {
  const prompt = `Generate a concise performance report for student ${studentName} based on the following grades: ${JSON.stringify(grades)}. Highlight strengths and areas for improvement.`;
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text;
};

export const predictAttendanceTrends = async (attendanceRecords: any[]) => {
  const prompt = `Analyze the following attendance records and predict trends: ${JSON.stringify(attendanceRecords)}. Provide a short summary.`;
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text;
};

export const generateNotification = async (type: string, details: string) => {
  const prompt = `Generate a professional notification message for ${type} with the following details: ${details}.`;
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text;
};

export const predictPerformanceTrends = async (studentName: string, grades: any[], attendance: any[]) => {
  const prompt = `Analyze the academic performance of student ${studentName} based on grades: ${JSON.stringify(grades)} and attendance records: ${JSON.stringify(attendance)}. Predict future performance trends, identify potential risks, and suggest actionable improvements. Keep the response concise.`;
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text;
};
