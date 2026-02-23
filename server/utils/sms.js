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
const KITE_URL = 'http://bulk.kitesms.com/v3/api.php';

/** Format amount in Indian locale with rupee symbol: e.g. 87266.52 -> Rs.87,266.52 */
function inr(amount) {
    const num = Number(amount) || 0;
    return 'Rs.' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Builds the SMS message matching the registered DLT template.
 * Template variables: name, thriftBalance, loanBalance, suretySignatures,
 *   dividend, monthlyThrift, monthlyLoanRepayment, monthlyInterest, totalMonthlyDeduction
 */
function buildSmsMessage({
    name,
    thriftBalance,
    loanBalance,
    suretySignatures,
    dividend = 0,
    monthlyThrift = 0,
    monthlyLoanRepayment = 0,
    monthlyInterest = 0,
    totalMonthlyDeduction = 0,
}) {
    return [
        `Dear ${name},`,
        ``,
        `Your account details with The Vignan Employees Mutually Aided Co-operative Thrift & Credit Society Ltd. are as follows:`,
        ``,
        `Thrift Balance: ${inr(thriftBalance)}`,
        `Loan Balance: ${inr(loanBalance)}`,
        `Surety Signatures: ${suretySignatures}`,
        `Dividend: ${inr(dividend)}`,
        ``,
        `Monthly Deduction Details:`,
        `Monthly Thrift Contribution: ${inr(monthlyThrift)}`,
        `Monthly Loan Repayment: ${inr(monthlyLoanRepayment)}`,
        `Monthly Interest Amount: ${inr(monthlyInterest)}`,
        `Total Monthly Deduction: ${inr(totalMonthlyDeduction)}`,
        ``,
        `For any clarification, please contact the Society Office.`,
        ``,
        `Thank you.`,
    ].join('\n');
}

/** Send a single SMS via KiteSMS API. */
async function sendKiteSms({ mobile, message }) {
    if (!process.env.KITE_API_KEY) {
        console.error('[SMS] Missing env KITE_API_KEY');
        throw new Error('Missing KITE_API_KEY environment variable');
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
        console.error('[SMS] KiteSMS request failed:', err && err.response ? { status: err.response.status, data: err.response.data } : err.message || err);
        throw err;
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
