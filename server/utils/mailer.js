/**
 * Email helpers using Brevo (https://brevo.com)
 * Brevo uses HTTPS (port 443) — not SMTP — works on Render free tier.
 * Unlike Resend test mode, Brevo allows sending to ANY email address
 * without domain verification (free tier: 300 emails/day).
 *
 * Setup:
 *  1. Sign up at https://app.brevo.com (free)
 *  2. Go to SMTP & API → API Keys → Generate a new API key
 *  3. Add to Render environment variables: BREVO_API_KEY = your_key
 */
const axios = require('axios');

function isEmailConfigured() {
    return !!(process.env.BREVO_API_KEY && process.env.BREVO_API_KEY !== '<your_brevo_api_key>');
}

/**
 * Core send helper using Brevo's transactional email HTTP API.
 * Accepts { from, to, subject, html, attachments }
 */
async function sendEmail({ from, to, subject, html, attachments }) {
    if (!isEmailConfigured()) {
        throw new Error(
            'Email is not configured. Add BREVO_API_KEY to your Render environment variables. ' +
            'Get a free key at https://app.brevo.com'
        );
    }

    // Parse sender — accept 'Name <email>' or plain 'email'
    const senderRaw = process.env.EMAIL_FROM || from || 'Vignan Society <vemasociety@gmail.com>';
    const senderMatch = senderRaw.match(/^(.+)<(.+)>$/);
    const sender = senderMatch
        ? { name: senderMatch[1].trim(), email: senderMatch[2].trim() }
        : { name: 'Vignan Society', email: senderRaw.trim() };

    // Brevo expects `to` as an array of { email } objects
    const toList = (Array.isArray(to) ? to : [to]).map(e =>
        typeof e === 'string' ? { email: e } : e
    );

    const payload = {
        sender,
        to: toList,
        subject,
        htmlContent: html,
    };

    if (attachments && attachments.length > 0) {
        payload.attachment = attachments.map(a => ({
            name: a.filename,
            content: (Buffer.isBuffer(a.content)
                ? a.content
                : Buffer.from(a.content, 'utf8')
            ).toString('base64'),
        }));
    }

    console.log('[Brevo] Sending → to:', to, '| subject:', subject);
    const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        payload,
        { headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' } }
    );
    console.log('[Brevo] Sent OK, messageId:', response.data?.messageId);
    return response.data;
}

// Legacy proxy — keeps backwards-compatibility for code that calls transporter.sendMail()
const transporter = {
    sendMail: ({ from, to, subject, html, attachments }) =>
        sendEmail({ from, to, subject, html, attachments }),
};

/**
 * Send welcome email to a newly created employee with their login credentials.
 * Only called when employee.email is known.
 */
async function sendWelcomeEmail({ name, email, empId, username, password }) {
    const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;
    await sendEmail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Vignan Society — Your Account Has Been Created',
        html: `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;
     padding:32px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
  <h2 style="color:#4f46e5;margin-bottom:4px;">Vignan Employees Thrift Society</h2>
  <p style="color:#64748b;margin-bottom:24px;font-size:14px;">Welcome to the Society portal</p>

  <p style="color:#374151;">Hello <strong>${name}</strong>,</p>
  <p style="color:#374151;line-height:1.6;">
    Your account has been created. Use the credentials below to log in for the first time.
    You will be prompted to set a new password on first login.
  </p>

  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;
       padding:20px 24px;margin:24px 0;font-size:15px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:6px 0;color:#64748b;width:130px;">Employee ID</td>
        <td style="padding:6px 0;color:#1e293b;font-weight:600;">${empId || '—'}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#64748b;">Username</td>
        <td style="padding:6px 0;color:#1e293b;font-weight:600;font-family:monospace;">${username}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#64748b;">Temporary Password</td>
        <td style="padding:6px 0;color:#4f46e5;font-weight:700;font-size:18px;
             letter-spacing:2px;font-family:monospace;">${password}</td>
      </tr>
    </table>
  </div>

  <div style="text-align:center;margin:28px 0;">
    <a href="${loginUrl}"
       style="background:#4f46e5;color:#fff;padding:12px 36px;border-radius:8px;
              text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
      Log In Now
    </a>
  </div>

  <p style="color:#94a3b8;font-size:12px;">
    Please change your password immediately after first login. Do not share these credentials.
  </p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
  <p style="color:#94a3b8;font-size:12px;text-align:center;">
    Vignan Employees Mutual Aid Society &nbsp;|&nbsp; IT Admin
  </p>
</div>`
    });
}

/**
 * Send a credentials summary to the admin's own email ("mail to self").
 * Always sent after an upload that creates at least one employee.
 */
async function sendCredentialsSummaryToAdmin(createdUsers, fileName) {
    const adminEmail = process.env.EMAIL_USER;
    if (!adminEmail) return;

    // Build HTML table rows
    const rows = createdUsers.map((u, i) => `
      <tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'};">
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${u.empId || '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${u.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${u.username}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;
             color:#4f46e5;font-weight:600;">${u.password}</td>
      </tr>`).join('');

    // Also build a plain-text CSV attachment
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csvLines = [
        ['Emp ID', 'Name', 'Username', 'Password'].map(escape).join(','),
        ...createdUsers.map(u => [u.empId || '', u.name, u.username, u.password].map(escape).join(','))
    ].join('\n');

    await sendEmail({
        from: process.env.EMAIL_FROM,
        to: adminEmail,
        subject: `[Vignan Society] ${createdUsers.length} New Employee Credential(s) — ${fileName}`,
        html: `
<div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;
     padding:32px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
  <h2 style="color:#4f46e5;margin-bottom:4px;">Vignan Employees Thrift Society</h2>
  <p style="color:#64748b;margin-bottom:8px;font-size:14px;">Admin Credential Summary — Upload Report</p>

  <p style="color:#374151;">
    <strong>${createdUsers.length}</strong> new employee account(s) were created from
    <strong>${fileName}</strong>. Credentials are listed below and attached as a CSV.
  </p>

  <table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:13px;">
    <thead>
      <tr style="background:#4f46e5;color:#fff;">
        <th style="padding:10px 12px;text-align:left;">#</th>
        <th style="padding:10px 12px;text-align:left;">Emp ID</th>
        <th style="padding:10px 12px;text-align:left;">Name</th>
        <th style="padding:10px 12px;text-align:left;">Username</th>
        <th style="padding:10px 12px;text-align:left;">Temp Password</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
    A CSV copy is attached to this email. Store it securely and delete after distributing credentials.
  </p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
  <p style="color:#94a3b8;font-size:12px;text-align:center;">
    Vignan Employees Mutual Aid Society &nbsp;|&nbsp; IT Admin Auto-Notification
  </p>
</div>`,
        attachments: [
            {
                filename: `credentials_${Date.now()}.csv`,
                content: csvLines,
                contentType: 'text/csv'
            }
        ]
    });
}

/**
 * Quick "self-test" — sends a test email to EMAIL_USER to verify SMTP config.
 */
async function sendSelfTestEmail() {
    const adminEmail = process.env.EMAIL_USER;
    await sendEmail({
        from: process.env.EMAIL_FROM,
        to: adminEmail,
        subject: '[Vignan Society] ✅ Email Configuration Test',
        html: `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;
     padding:32px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
  <h2 style="color:#4f46e5;">Vignan Employees Thrift Society</h2>
  <p style="color:#374151;">
    This is a <strong>test email</strong> confirming that the SMTP email
    configuration is working correctly.
  </p>
  <p style="color:#374151;">
    Sent at: <strong>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong>
  </p>
  <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
    If you did not trigger this from the admin panel, please review server access logs.
  </p>
</div>`
    });
    return adminEmail;
}

/**
 * Send monthly update notification email to one employee.
 * Called in a loop by the admin notify route.
 */
async function sendMonthlyUpdateNotification(employee, displayMonth) {
    const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}`;
    await sendEmail({
        from: process.env.EMAIL_FROM,
        to: employee.email,
        subject: `Vignan Society — ${displayMonth} Monthly Update Ready`,
        html: `
<div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;
     padding:32px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
  <h2 style="color:#4f46e5;margin-bottom:4px;">Vignan Employees Thrift Society</h2>
  <p style="color:#64748b;margin-bottom:24px;font-size:14px;">Monthly Financial Update</p>

  <p style="color:#374151;">Dear <strong>${employee.name}</strong>,</p>
  <p style="color:#374151;line-height:1.7;">
    Your financial data for <strong>${displayMonth}</strong> has been updated by the admin.
    This includes your thrift deduction, loan EMI, and net salary for the month.
  </p>

  <div style="text-align:center;margin:32px 0;">
    <a href="${loginUrl}"
       style="background:#4f46e5;color:#fff;padding:12px 36px;border-radius:8px;
              text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
      View My Records
    </a>
  </div>

  <p style="color:#94a3b8;font-size:12px;">
    Log in to your portal to view the detailed breakdown of your salary, thrift balance, and loan details.
  </p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
  <p style="color:#94a3b8;font-size:12px;text-align:center;">
    Vignan Employees Mutual Aid Society &nbsp;|&nbsp; Auto-Notification
  </p>
</div>`
    });
}

module.exports = { transporter, isEmailConfigured, sendWelcomeEmail, sendCredentialsSummaryToAdmin, sendSelfTestEmail, sendMonthlyUpdateNotification };
