const nodemailer = require("nodemailer");

// --- Core transport ------------------------------------------------------

const dns = require('dns');

function createTransporter() {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // use STARTTLS on port 587
        requireTLS: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        },
        // Force IPv4 DNS lookup to avoid IPv6 ENETUNREACH errors in some environments
        lookup: (hostname, options, callback) => dns.lookup(hostname, { family: 4 }, callback),
        connectionTimeout: 10000,
    });
}

/**
 * Core send helper.
 * Signature: sendEmail(to, subject, html, attachments?)
 * Also accepts a single options object for backwards-compat:
 *   sendEmail({ to, subject, html, attachments })
 */
const sendEmail = async (to, subject, html, attachments) => {
    // Support legacy object-style call: sendEmail({ to, subject, html, ... })
    if (to && typeof to === "object" && !Array.isArray(to)) {
        ({ to, subject, html, attachments } = to);
    }

    try {
        const transporter = createTransporter();
        await transporter.verify();

        const mailOptions = {
            from: `"Vignan Society" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };

        if (attachments && attachments.length > 0) {
            mailOptions.attachments = attachments.map((a) => ({
                filename: a.filename,
                content: a.content,
                contentType: a.contentType || "application/octet-stream",
            }));
        }

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully to:", to);
    } catch (error) {
        console.error("Email error:", error);
        throw error;
    }
};

// Legacy compatibility --- kept so auth.js `transporter.sendMail()` still works
const transporter = {
    sendMail: ({ from, to, subject, html, attachments }) =>
        sendEmail(to, subject, html, attachments),
};

function isEmailConfigured() {
    return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

// --- Helper emails -------------------------------------------------------

async function sendWelcomeEmail({ name, email, empId, username, password }) {
    const loginUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/login`;
    await sendEmail(
        email,
        "Vignan Society --- Your Account Has Been Created",
        `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
  <h2 style="color:#4f46e5;">Vignan Employees Thrift Society</h2>
  <p style="color:#64748b;font-size:14px;">Welcome to the Society portal</p>
  <p style="color:#374151;">Hello <strong>${name}</strong>,</p>
  <p style="color:#374151;line-height:1.6;">Your account has been created. Use the credentials below to log in for the first time. You will be prompted to set a new password on first login.</p>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin:24px 0;font-size:15px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#64748b;width:130px;">Employee ID</td><td style="padding:6px 0;color:#1e293b;font-weight:600;">${empId || "---"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Username</td><td style="padding:6px 0;color:#1e293b;font-weight:600;font-family:monospace;">${username}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Temporary Password</td><td style="padding:6px 0;color:#4f46e5;font-weight:700;font-size:18px;letter-spacing:2px;font-family:monospace;">${password}</td></tr>
    </table>
  </div>
  <div style="text-align:center;margin:28px 0;"><a href="${loginUrl}" style="background:#4f46e5;color:#fff;padding:12px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">Log In Now</a></div>
  <p style="color:#94a3b8;font-size:12px;">Please change your password immediately after first login.</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
  <p style="color:#94a3b8;font-size:12px;text-align:center;">Vignan Employees Mutual Aid Society | IT Admin</p>
</div>`
    );
}

async function sendCredentialsSummaryToAdmin(createdUsers, fileName) {
    const adminEmail = process.env.EMAIL_USER;
    if (!adminEmail) return;

    const rows = createdUsers.map((u, i) =>
        `<tr style="background:${i % 2 === 0 ? "#f8fafc" : "#fff"};"><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${i + 1}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${u.empId || "---"}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${u.name}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${u.username}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;color:#4f46e5;font-weight:600;">${u.password}</td></tr>`
    ).join("");

    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csvLines = [
        ["Emp ID", "Name", "Username", "Password"].map(escape).join(","),
        ...createdUsers.map((u) => [u.empId || "", u.name, u.username, u.password].map(escape).join(",")),
    ].join("\n");

    await sendEmail(
        adminEmail,
        `[Vignan Society] ${createdUsers.length} New Employee Credential(s) --- ${fileName}`,
        `<div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
  <h2 style="color:#4f46e5;">Vignan Employees Thrift Society</h2>
  <p style="color:#64748b;font-size:14px;">Admin Credential Summary --- Upload Report</p>
  <p style="color:#374151;"><strong>${createdUsers.length}</strong> new employee account(s) were created from <strong>${fileName}</strong>.</p>
  <table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:13px;">
    <thead><tr style="background:#4f46e5;color:#fff;"><th style="padding:10px 12px;text-align:left;">#</th><th style="padding:10px 12px;text-align:left;">Emp ID</th><th style="padding:10px 12px;text-align:left;">Name</th><th style="padding:10px 12px;text-align:left;">Username</th><th style="padding:10px 12px;text-align:left;">Temp Password</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="color:#94a3b8;font-size:12px;margin-top:24px;">A CSV copy is attached. Store it securely.</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
  <p style="color:#94a3b8;font-size:12px;text-align:center;">Vignan Employees Mutual Aid Society | IT Admin Auto-Notification</p>
</div>`,
        [{ filename: `credentials_${Date.now()}.csv`, content: csvLines, contentType: "text/csv" }]
    );
}

async function sendSelfTestEmail() {
    const adminEmail = process.env.EMAIL_USER;
    await sendEmail(
        adminEmail,
        "[Vignan Society] Email Configuration Test",
        `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
  <h2 style="color:#4f46e5;">Vignan Employees Thrift Society</h2>
  <p style="color:#374151;">This is a <strong>test email</strong> confirming that Gmail SMTP is working correctly.</p>
  <p style="color:#374151;">Sent at: <strong>${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</strong></p>
  <p style="color:#94a3b8;font-size:12px;margin-top:24px;">If you did not trigger this, please review server access logs.</p>
</div>`
    );
    return adminEmail;
}

async function sendMonthlyUpdateNotification(employee, displayMonth) {
    const loginUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}`;
    await sendEmail(
        employee.email,
        `Vignan Society --- ${displayMonth} Monthly Update Ready`,
        `<div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
  <h2 style="color:#4f46e5;">Vignan Employees Thrift Society</h2>
  <p style="color:#64748b;font-size:14px;">Monthly Financial Update</p>
  <p style="color:#374151;">Dear <strong>${employee.name}</strong>,</p>
  <p style="color:#374151;line-height:1.7;">Your financial data for <strong>${displayMonth}</strong> has been updated by the admin.</p>
  <div style="text-align:center;margin:32px 0;"><a href="${loginUrl}" style="background:#4f46e5;color:#fff;padding:12px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">View My Records</a></div>
  <p style="color:#94a3b8;font-size:12px;">Log in to view your salary, thrift balance, and loan details.</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
  <p style="color:#94a3b8;font-size:12px;text-align:center;">Vignan Employees Mutual Aid Society | Auto-Notification</p>
</div>`
    );
}

module.exports = {
    sendEmail,
    transporter,
    isEmailConfigured,
    sendWelcomeEmail,
    sendCredentialsSummaryToAdmin,
    sendSelfTestEmail,
    sendMonthlyUpdateNotification,
};
