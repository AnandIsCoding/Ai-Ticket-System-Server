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
    let ticket, moderator, updatedTicket, aiResponse = {};

    try {
      console.log("🚀 Inngest Function triggered for event:", event.name);

      // 1️⃣ Ensure MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(DATABASE_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log("✅ Connected to MongoDB");
      } else {
        console.log("✅ MongoDB already connected");
      }

      const { ticketId } = event.data;
      if (!ticketId) throw new NonRetriableError("No ticketId in event data");

      // 2️⃣ Fetch ticket
      ticket = await step.run("fetch-ticket", async () => {
        // make sure ticketId is ObjectId
        const id = new mongoose.Types.ObjectId(ticketId);
        const t = await Ticket.findById(id);
        if (!t) throw new NonRetriableError("Ticket not found");
        return t;
      });
      console.log("✅ Ticket fetched:", ticket._id.toString());

      // 3️⃣ Run AI analysis safely
      try {
        aiResponse = await analyzeTicket(ticket);
        if (!aiResponse) {
          aiResponse = {
            priority: "Medium",
            helpfulNotes: "No AI suggestions available",
            relatedSkills: [],
          };
        }
      } catch (err) {
        console.error("❌ AI agent failed:", err);
        aiResponse = {
          priority: "Medium",
          helpfulNotes: "No AI suggestions available",
          relatedSkills: [],
        };
      }
      console.log("AI response:", aiResponse);

      // 4️⃣ Pick moderator/admin or fallback to specific email
      moderator = await step.run("assign-moderator", async () => {
        let user =
          (await User.findOne({ role: "moderator" })) ||
          (await User.findOne({ role: "admin" })) ||
          (await User.findOne({ email: "anandkumarj669@gmail.com" }));

        if (!user) throw new NonRetriableError("No admin or moderator found");
        return user;
      });
      console.log("✅ Assigned to user:", moderator.email, moderator._id.toString());

      // 5️⃣ Update ticket with AI fields + assignedTo
      updatedTicket = await step.run("update-ticket", async () => {
        const updated = await Ticket.findByIdAndUpdate(
          ticket._id,
          {
            priority: (aiResponse.priority || "Medium").toLowerCase(),
            helpfulNotes: aiResponse.helpfulNotes || "No notes provided by AI",
            relatedSkills: Array.isArray(aiResponse.relatedSkills)
              ? aiResponse.relatedSkills
              : ["general"],
            status: "In Progress",
            // moderator._id is already an ObjectId
            assignedTo: moderator._id,
          },
          { new: true, runValidators: true }
        );

        if (!updated) throw new NonRetriableError("Ticket update failed");
        return updated;
      });
      console.log("✅ Ticket updated successfully:", updatedTicket._id.toString());

      // 6️⃣ Send email
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

      console.log("🎉 Inngest Function completed successfully");
      return { success: true, ticketId: updatedTicket._id.toString() };
    } catch (err) {
      console.error("❌ Inngest Function Error:", err);
      return { success: false, error: err.message };
    }
  }
);
