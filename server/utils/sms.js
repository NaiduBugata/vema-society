/**
 * KiteSMS utility
 * Sends transactional SMS via bulk.kitesms.com
 *
 * Required ENV:
 *   KITE_USERNAME    - KiteSMS username
 *   KITE_API_KEY     - KiteSMS API key
 *   KITE_SENDER_ID   - approved sender ID (e.g. VEMACS)
 *   KITE_TEMPLATE_ID - DLT approved template ID
 *
 * IMPORTANT: The message MUST match the exact DLT-registered template.
 * Register this template on https://www.kitesms.com and update KITE_TEMPLATE_ID in .env.
 */
const axios = require('axios');

// Use HTTP host because the provider certificate presented for
// bulk.kitesms.com does not include that hostname in its SANs.
// Revert to HTTP endpoint which the provider accepts.
const KITE_URL = process.env.KITE_URL || 'http://bulk.kitesms.com/v3/api.php';

/** Format amount in Indian locale (no currency symbol; template already contains ₹). */
function inr(amount) {
    const num = Number(amount) || 0;
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Builds the SMS message matching the registered DLT template.
 * Template variables (DLT):
 *   name, orgName, thriftBalance, loanBalance, suretySignatures, dividend,
 *   monthlyThrift, monthlyLoanRepayment, monthlyInterest, totalMonthlyDeduction
 */
function buildSmsMessage({
    name,
    orgName,
    thriftBalance,
    loanBalance,
    suretySignatures,
    dividend = 0,
    monthlyThrift = 0,
    monthlyLoanRepayment = 0,
    monthlyInterest = 0,
    totalMonthlyDeduction = 0,
}) {
    // Must match the DLT registered template text exactly (spacing/punctuation/case).
    return `Dear ${name},\nGreetings from the official website of ${orgName}. This is to inform you that, as per the latest records available on the Society’s website, your account details are as follows: Thrift Balance – ₹${inr(thriftBalance)}; Loan Balance – ₹${inr(loanBalance)}; Surety Signatures – ${suretySignatures}; Dividend – ₹${inr(dividend)}. Your monthly deduction details include Monthly Thrift Contribution – ₹${inr(monthlyThrift)}, Monthly Loan Repayment – ₹${inr(monthlyLoanRepayment)}, Monthly Interest Amount – ₹${inr(monthlyInterest)}, making the Total Monthly Deduction – ₹${inr(totalMonthlyDeduction)}. Kindly review the above information, and for any clarification or further assistance, please contact the Society Office. Thank you for your continued association with the Society.`;
}

/** Send a single SMS via KiteSMS API. */
async function sendKiteSms({ mobile, message }) {
    const missing = [];
    if (!process.env.KITE_USERNAME) missing.push('KITE_USERNAME');
    if (!process.env.KITE_API_KEY) missing.push('KITE_API_KEY');
    if (!process.env.KITE_SENDER_ID) missing.push('KITE_SENDER_ID');
    if (!process.env.KITE_TEMPLATE_ID) missing.push('KITE_TEMPLATE_ID');
    if (missing.length) {
        console.error('[SMS] Missing env vars:', missing);
        throw new Error(`Missing SMS env var(s): ${missing.join(', ')}`);
    }

    const params = {
        username: process.env.KITE_USERNAME,
        apikey: process.env.KITE_API_KEY,
        senderid: process.env.KITE_SENDER_ID,
        templateid: process.env.KITE_TEMPLATE_ID,
        route: 'Transactional',
        mobile,
        message,
    };

    // Debug logging: show outgoing params (mask apikey)
    const safeParams = { ...params, apikey: process.env.KITE_API_KEY ? '***masked***' : undefined };
    console.log('[SMS] Sending to KiteSMS', { url: KITE_URL, params: safeParams });

    try {
        const response = await axios.get(KITE_URL, { params, timeout: 15000 });
        console.log('[SMS] HTTP status:', response.status);
        const result = response.data;
        console.log('[SMS] KiteSMS response raw:', result);

        // Kite may return an object like { Error: 'Invalid Request' }
        if (typeof result === 'string' && result.toUpperCase().startsWith('ERROR')) {
            throw new Error(`KiteSMS error: ${result}`);
        }
        if (result && (result.Error || result.error || result.INVALID)) {
            throw new Error(`KiteSMS error response: ${JSON.stringify(result)}`);
        }

        return result;
    } catch (err) {
        const status = err?.response?.status;
        const data = err?.response?.data;
        console.error('[SMS] KiteSMS request failed:', status ? { status, data } : (err?.message || err));

        if (status && data !== undefined) {
            const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
            throw new Error(`KiteSMS HTTP ${status}: ${dataStr}`);
        }
        throw new Error(`KiteSMS request failed: ${err?.message || String(err)}`);
    }
}

/** Send monthly financial update SMS to a single employee. */
async function sendMonthlyUpdateSms(employee, txData = {}, dividend = 0) {
    const mobile = (employee.phone || '').replace(/\D/g, '');
    if (!mobile || mobile.length < 10) {
        throw new Error(`Invalid/missing phone for employee ${employee.name}`);
    }

    const loanBalance = employee.activeLoan ? (employee.activeLoan.remainingBalance || 0) : 0;
    const suretySignatures = (employee.guaranteeingLoans || []).length;

    const message = buildSmsMessage({
        name:                  employee.name,
        orgName:               'The Vignan Employees Mutually Aided Co-operative Thrift & Credit Society Ltd.',
        thriftBalance:         employee.thriftBalance || 0,
        loanBalance,
        suretySignatures,
        dividend,
        monthlyThrift:         txData.thriftDeduction      || 0,
        monthlyLoanRepayment:  txData.principalRepayment   || 0,
        monthlyInterest:       txData.interestPayment      || 0,
        totalMonthlyDeduction: txData.totalDeduction       || 0,
    });

    return sendKiteSms({ mobile, message });
}

module.exports = { sendMonthlyUpdateSms, sendKiteSms, buildSmsMessage };
