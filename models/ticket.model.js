import mongoose, { Schema } from "mongoose";

const ticketSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["Todo", "In Progress", "Resolved", "Closed"],
      default: "Todo",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    priority: {
      type: String,
      default: "medium",
    },
    deadline: {
      type: Date,
    },
    helpfulNotes: {
      type: String,
    },
    relatedSkills: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
); // adds createdAt & updatedAt automatically

ticketSchema.index({ status: 1 });
ticketSchema.index({ assignedTo: 1 });

const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
export default Ticket;
