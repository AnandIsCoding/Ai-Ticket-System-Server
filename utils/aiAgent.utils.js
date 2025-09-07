import mongoose from "mongoose";
import { inngest } from "../client.js";
import Ticket from "../../models/ticket.model.js";
import User from "../../models/user.model.js";
import { NonRetriableError } from "inngest";
import mailSender from "../../utils/mailSender.utils.js";
import ticketAssignedEmail from "../../mail/templates/ticketAssignedEmail.js";
import { DATABASE_URI, GEMINI_API_KEY } from "../../configs/server.config.js";
import { createAgent, gemini } from "@inngest/agent-kit";

// AI Analysis Function
const analyzeTicket = async (ticket) => {
  const supportAgent = createAgent({
    model: gemini({
      model: "gemini-1.5-flash-8b",
      apiKey: GEMINI_API_KEY,
    }),
    name: "AI Ticket Triage Assistant",
    system: `You are an expert AI assistant that processes technical support tickets.
Respond with valid raw JSON only:
- summary (1-2 sentences)
- priority ("Low", "Medium", "High")
- helpfulNotes (technical guidance)
- relatedSkills (array of relevant skills)
`,
  });

  const response = await supportAgent.run(`
Analyze the following ticket and return a strict JSON object:

Title: ${ticket.title}
Description: ${ticket.description}
`);

  const raw = response?.output?.[0]?.content || "";
  if (!raw) return null;

  try {
    const cleaned = raw.replace(/```json\s*|```/gi, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse AI JSON:", err.message);
    return null;
  }
};

// Inngest Function
export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 4 },
  { event: "ticket/created" },
  async ({ event }) => {
    const { ticketId } = event.data;

    // Immediately respond to avoid serverless timeout
    (async () => {
      try {
        // Ensure MongoDB connection
        if (mongoose.connection.readyState === 0) {
          await mongoose.connect(DATABASE_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
          console.log("✅ MongoDB connected");
        }

        // Fetch ticket
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) throw new NonRetriableError("Ticket not found");

        // Pick moderator/admin
        const moderator =
          (await User.findOne({ role: "moderator" })) ||
          (await User.findOne({ role: "admin" }));
        if (!moderator) throw new NonRetriableError("No moderator/admin found");

        // AI analysis
        let aiResponse = {};
        try {
          aiResponse = (await analyzeTicket(ticket)) || {};
        } catch (err) {
          console.error("❌ AI failed:", err);
        }

        // Update ticket with AI fields + assignedTo
        const updatedTicket = await Ticket.findByIdAndUpdate(
          ticket._id,
          {
            priority: aiResponse?.priority?.toLowerCase?.() || "medium",
            helpfulNotes: aiResponse?.helpfulNotes || "",
            relatedSkills: Array.isArray(aiResponse?.relatedSkills)
              ? aiResponse.relatedSkills
              : [],
            status: "In Progress",
            assignedTo: moderator._id,
          },
          { new: true }
        );

        console.log("✅ Ticket updated:", updatedTicket._id);

        // Send email
        try {
          await mailSender(
            moderator.email,
            `New Ticket Assigned: ${updatedTicket.title}`,
            ticketAssignedEmail(moderator.email, updatedTicket.title)
          );
          console.log("✅ Email sent to:", moderator.email);
        } catch (err) {
          console.error("❌ Email failed:", err);
        }
      } catch (err) {
        console.error("❌ Inngest background error:", err);
      }
    })();

    // Return immediately
    return { success: true, message: "Ticket processing started in background" };
  }
);
