const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
      },
    });

    await transporter.sendMail({
      from: "Vignan Society <noreply@brevo.com>",
      to,
      subject,
      html,
    });

    console.log("Email sent successfully");
  } catch (err) {
    console.error("Email error:", err);
    throw err;
  }
};

module.exports = sendEmail;
