
import chalk from "chalk";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

import { MAIL_HOST, MAIL_PASS, MAIL_PORT, MAIL_USER } from "../configs/server.config.js";

dotenv.config();

const mailSender = async (email, title, body) => {
  try {
    if (!email || !title || !body) {
      throw new Error("Email, title, and body are required to send an email.");
    }

    let transporter = nodemailer.createTransport({
      host: MAIL_HOST,
      port: MAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
      },
    });

    let info = await transporter.sendMail({
      from: `AI Ticket Raiser <${MAIL_USER}>`,
      to: email,
      subject: title,
      html: body,
    });

    // console.log(chalk.green.bold('✅ Email sent successfully!'));
    // console.log(chalk.cyan('📬 To:'), chalk.white(email));
    // console.log(chalk.yellow('ℹ️ Message Info:'), info);

    return info;
  } catch (error) {
    console.error(
      chalk.bgRed.white("❌ Error in mailSender:"),
      chalk.red(error.message)
    );
  }
};

export default mailSender;
