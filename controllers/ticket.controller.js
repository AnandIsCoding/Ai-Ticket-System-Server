import chalk from "chalk";
import { StatusCodes } from "http-status-codes";
import { inngest } from "../inngest/client.js";
import Ticket from "../models/ticket.model.js";

export const createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Title and Description are required",
      });
    }

    const newTicket = await Ticket.create({
      title,
      description,
      createdBy: req.user.userId,
      status: "Todo",
      priority: "medium",
      relatedSkills: [],
    });

    // console.log("Ticket created:", newTicket);

    // Send event to Inngest
    await inngest.send({
      name: "ticket/created", // ← add slash here
      data: {
        ticketId: newTicket._id,
        title,
        description,
        createdBy: req.user.userId,
      },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Ticket created and processing started",
      ticket: newTicket,
    });
  } catch (error) {
    console.error(chalk.red("Error creating ticket"), error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal Server Error" });
  }
};

export const getTicket = async (req, res) => {
  try {
    const user = req.user;
    let ticket;

    if (user.role !== "user") {
      ticket = await Ticket.findById(req.params.id).populate("assignedTo", [
        "email",
        "_id",
      ]);
    } else {
      ticket = await Ticket.findOne({
        createdBy: user.userId,
        _id: req.params.id,
      }).select("title description status createdAt");
    }

    if (!ticket) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Ticket not found" });
    }

    return res.status(StatusCodes.OK).json({ ticket });
  } catch (error) {
    console.error("Error fetching ticket", error.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const user = req.user;
    let tickets = [];

    if (user.role !== "user") {
      tickets = await Ticket.find({})
        .populate("assignedTo", ["email", "_id"])
        .sort({ createdAt: -1 });
    } else {
      tickets = await Ticket.find({ createdBy: user.userId })
        .select("title description status createdAt")
        .sort({ createdAt: -1 });
    }

    return res.status(StatusCodes.OK).json({ tickets });
  } catch (error) {
    console.error("Error fetching tickets", error.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal Server Error" });
  }
};
