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
    const params = {
        username: process.env.KITE_USERNAME,
        apikey: process.env.KITE_API_KEY,
        senderid: process.env.KITE_SENDER_ID,
        templateid: process.env.KITE_TEMPLATE_ID,
        route: 'Transactional',
        mobile,
        message,
    };

    const response = await axios.get(KITE_URL, { params, timeout: 10000 });
    const result = response.data;
    if (typeof result === 'string' && result.toUpperCase().startsWith('ERROR')) {
        throw new Error(`KiteSMS error: ${result}`);
    }
    console.log(`[SMS] KiteSMS response:`, result);
    return result;
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
