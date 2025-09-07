import { NonRetriableError } from "inngest";
import mongoose from "mongoose";

import { DATABASE_URI } from "../../configs/server.config.js";
import ticketAssignedEmail from "../../mail/templates/ticketAssignedEmail.js";
import Ticket from "../../models/ticket.model.js";
import User from "../../models/user.model.js";
import analyzeTicket from "../../utils/aiAgent.utils.js";
import mailSender from "../../utils/mailSender.utils.js";
import { inngest } from "../client.js";

export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 4 },
  { event: "ticket/created" },
  async ({ event, step }) => {
    try {
      // Connect to MongoDB
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(DATABASE_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      }

      // Fetch ticket
      const ticket = await step.run("fetch-ticket", async () => {
        const t = await Ticket.findById(event.data.ticketId);
        if (!t) throw new NonRetriableError("Ticket not found");
        return t;
      });

      // Pick moderator/admin
      const moderator = await step.run("assign-moderator", async () => {
        const user = await User.findOne({ role: "moderator" }) || await User.findOne({ role: "admin" });
        if (!user) throw new NonRetriableError("No moderator/admin found");
        return user;
      });

      // Immediately update ticket to "In Progress" + assignedTo (synchronous)
      const updatedTicket = await Ticket.findByIdAndUpdate(ticket._id, {
        status: "In Progress",
        assignedTo: moderator._id,
      }, { new: true });

      // Fire-and-forget: AI analysis + helpfulNotes + relatedSkills
      analyzeTicket(ticket).then(async (aiResponse) => {
        try {
          await Ticket.findByIdAndUpdate(ticket._id, {
            priority: aiResponse?.priority?.toLowerCase?.() || "medium",
            helpfulNotes: aiResponse?.helpfulNotes || "",
            relatedSkills: Array.isArray(aiResponse?.relatedSkills) ? aiResponse.relatedSkills : [],
          });
        } catch (err) {
          console.error("❌ Failed to update ticket with AI fields:", err);
        }
      });

      // Fire-and-forget: email
      mailSender(
        moderator.email,
        `New Ticket Assigned: ${updatedTicket.title}`,
        ticketAssignedEmail(moderator.email, updatedTicket.title)
      ).catch(err => console.error("❌ Failed to send email:", err));

      return { success: true, message: "Ticket processing started in background" };

    } catch (err) {
      console.error("❌ Inngest Function Error:", err);
      return { success: false };
    }
  }
);

