import mongoose from "mongoose";
import { inngest } from "../client.js";
import Ticket from "../../models/ticket.model.js";
import User from "../../models/user.model.js";
import { NonRetriableError } from "inngest";
import mailSender from "../../utils/mailSender.utils.js";
import ticketAssignedEmail from "../../mail/templates/ticketAssignedEmail.js";
import { DATABASE_URI } from "../../configs/server.config.js";
import analyzeTicket from "../../utils/aiAgent.utils.js";

export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 4 },
  { event: "ticket/created" },
  async ({ event, step }) => {
    try {
      // 1️⃣ Ensure MongoDB connection is ready
      if (mongoose.connection.readyState === 0) {
        try {
          await mongoose.connect(DATABASE_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
          console.log("✅ Connected to MongoDB");
        } catch (dbErr) {
          console.error("❌ MongoDB connection failed:", dbErr);
          throw new NonRetriableError("DB connection failed");
        }
      }

      const { ticketId } = event.data;

      // 2️⃣ Fetch ticket safely
      const ticket = await step.run("fetch-ticket", async () => {
        const t = await Ticket.findById(ticketId);
        if (!t) throw new NonRetriableError("Ticket not found");
        return t;
      });

      // 3️⃣ Run AI analysis safely with fallback
      let aiResponse = {};
      try {
        aiResponse = await analyzeTicket(ticket);
      } catch (err) {
        console.error("❌ AI agent failed:", err);
        aiResponse = {};
      }

      console.log("AI response:", aiResponse);

      // 4️⃣ Pick moderator/admin
      const moderator = await step.run("assign-moderator", async () => {
        const user =
          (await User.findOne({ role: "moderator" })) ||
          (await User.findOne({ role: "admin" }));
        if (!user) throw new NonRetriableError("No admin or moderator found");
        return user;
      });

      // 5️⃣ Update ticket with AI fields + assignedTo
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

      // 6️⃣ Send email safely
      await step.run("send-email", async () => {
        try {
          await mailSender(
            moderator.email,
            `New Ticket Assigned: ${updatedTicket.title}`,
            ticketAssignedEmail(moderator.email, updatedTicket.title)
          );
          console.log("✅ Email sent to:", moderator.email);
        } catch (mailErr) {
          console.error("❌ Email failed:", mailErr);
        }
      });

      return { success: true };
    } catch (err) {
      console.error("❌ Inngest Function Error:", err);
      return { success: false };
    }
  }
);
