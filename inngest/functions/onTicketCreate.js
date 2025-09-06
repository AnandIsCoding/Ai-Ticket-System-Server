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
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(DATABASE_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log("Inngest function connected to MongoDB ✅");
      }

      const { ticketId } = event.data;

      // fetch ticket
      const ticket = await step.run("fetch-ticket", async () => {
        const t = await Ticket.findById(ticketId);
        if (!t) throw new NonRetriableError("Ticket not found");
        return t;
      });

      // AI analysis
      const aiResponse = await analyzeTicket(ticket);

      console.log('AI response is -->> ',aiResponse)

      // pick moderator/admin
      const moderator = await step.run("assign-moderator", async () => {
        let user =
          (await User.findOne({ role: "moderator" })) ||
          (await User.findOne({ role: "admin" }));
        if (!user) throw new NonRetriableError("No admin or moderator found");
        return user;
      });

      // update ticket with AI fields + assignedTo
      const updatedTicket = await Ticket.findByIdAndUpdate(
  ticket._id,
  {
    priority: aiResponse?.priority?.toLowerCase?.() || "medium",
    helpfulNotes: aiResponse?.helpfulNotes || "",
    relatedSkills: Array.isArray(aiResponse?.relatedSkills)
      ? aiResponse.relatedSkills
      : [],
    status: "In Progress", // must match schema enum
    assignedTo: moderator._id,
  },
  { new: true }
);

      // console.log("Ticket updated in DB:", updatedTicket);

      // send email
      await step.run("send-email", async () => {
        await mailSender(
          moderator.email,
          `New Ticket Assigned: ${updatedTicket.title}`,
          ticketAssignedEmail(moderator.email, updatedTicket.title)
        );
        console.log("Email sent to:", moderator.email);
      });

      return { success: true };
    } catch (err) {
      console.error("❌ Inngest Function Error:", err);
      return { success: false };
    }
  }
);
