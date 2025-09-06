import { createAgent, gemini } from "@inngest/agent-kit";
import { GEMINI_API_KEY } from "../configs/server.config.js";

const analyzeTicket = async (ticket) => {
  const supportAgent = createAgent({
    model: gemini({
      model: "gemini-1.5-flash-8b",
      apiKey: GEMINI_API_KEY,
    }),
    name: "AI Ticket Triage Assistant",
    system: `You are an expert AI assistant that processes technical support tickets.

Your job is to:
1. Summarize the issue.
2. Estimate its priority.
3. Provide helpful notes and resource links for human moderators.
4. List relevant technical skills required.

IMPORTANT:
- Respond with only valid raw JSON.
- Do NOT include markdown, code fences, comments, or extra formatting.
- The format must be a raw JSON object.`
  });

  // Prompt the AI to analyze the ticket
  const response = await supportAgent.run(`
Analyze the following ticket and return only a strict JSON object with:
- summary (1-2 sentences)
- priority ("Low", "Medium", or "High")
- helpfulNotes (technical guidance)
- relatedSkills (array of relevant skills)

Ticket:
Title: ${ticket.title}
Description: ${ticket.description}
`);

  
  // console.log("Full AI response:", JSON.stringify(response, null, 2));

  // Extract raw text from multiple possible fields
  const output = response?.output?.[0];
const raw = output?.content || ""; // content is already a string


  if (!raw) {
  console.log("AI returned empty response");
  return null;
}

try {
  const cleaned = raw.replace(/```json\s*|```/gi, "").trim();
  const parsed = JSON.parse(cleaned);
  return parsed;
} catch (err) {
  console.log("Failed to parse AI JSON:", err.message);
  console.log("Raw AI output:", raw);
  return null;
}

};

export default analyzeTicket;
