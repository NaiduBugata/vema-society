const sgMail = require('@sendgrid/mail');

let isConfigured = false;
function ensureConfigured() {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('Missing SENDGRID_API_KEY');
  }

  if (!isConfigured) {
    sgMail.setApiKey(apiKey);
    isConfigured = true;
  }

  const from = process.env.SENDGRID_FROM || process.env.EMAIL_FROM;
  if (!from) {
    throw new Error('Missing SENDGRID_FROM (or EMAIL_FROM)');
  }
  return { from };
}

const sendEmail = async (to, subject, html) => {
  const { from } = ensureConfigured();
  try {
    await sgMail.send({
      to,
      from,
      subject,
      html,
    });
    console.log('Email sent successfully');
  } catch (err) {
    // SendGrid errors often include response.body with useful info.
    const details = err?.response?.body ? JSON.stringify(err.response.body) : (err?.message || String(err));
    console.error('Email error:', details);
    throw new Error(details);
  }
};

module.exports = sendEmail;
