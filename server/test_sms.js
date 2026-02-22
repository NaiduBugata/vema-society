require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

async function main() {
    // 1. ENV check
    console.log('=== ENV CHECK ===');
    const vars = ['KITE_USERNAME','KITE_API_KEY','KITE_SENDER_ID','KITE_TEMPLATE_ID'];
    for (const v of vars) console.log(`${v.padEnd(20)}: ${process.env[v] || '--- MISSING ---'}`);

    // 2. Phone numbers in DB
    await mongoose.connect(process.env.MONGODB_URI);
    const total     = await Employee.countDocuments();
    const withPhone = await Employee.countDocuments({ phone: { $exists: true, $ne: '' } });
    const sample    = await Employee.findOne({ phone: { $exists: true, $ne: '' } }, 'name empId phone');
    console.log('\n=== PHONE NUMBERS IN DB ===');
    console.log('Total employees  :', total);
    console.log('With phone number:', withPhone);
    if (sample) console.log('Sample employee  :', sample.name, '| phone:', sample.phone);
    else console.log('NO employees have a phone number stored!');
    await mongoose.disconnect();

    // 3. Live API test
    if (!sample) {
        console.log('\nCannot test SMS — no phone numbers in DB.');
        console.log('ACTION REQUIRED: Upload employee Excel with a "Phone" column, or manually add phone numbers via admin panel.');
        return;
    }
    const mobile = (sample.phone || '').replace(/\D/g, '');
    console.log('\n=== KITESMS LIVE TEST ===');
    console.log('Sending to      :', mobile, `(length: ${mobile.length})`);
    if (mobile.length < 10) {
        console.log('ERROR: Phone number too short / invalid:', sample.phone);
        return;
    }
    const message = `Dear ${sample.name}, this is a VEMA Society SMS test. Please ignore.`;
    try {
        const res = await axios.get('http://bulk.kitesms.com/v3/api.php', {
            params: {
                username:   process.env.KITE_USERNAME,
                apikey:     process.env.KITE_API_KEY,
                senderid:   process.env.KITE_SENDER_ID,
                templateid: process.env.KITE_TEMPLATE_ID,
                route:      'Transactional',
                mobile,
                message
            },
            timeout: 15000
        });
        console.log('HTTP Status :', res.status);
        console.log('Raw Response:', JSON.stringify(res.data));
        const r = String(res.data || '').trim().toUpperCase();
        if (r.startsWith('ERROR')) {
            console.log('\nRESULT: FAILED — KiteSMS returned error:', res.data);
            console.log('\nCOMMON CAUSES:');
            console.log('  ERROR|Invalid credentials → wrong KITE_USERNAME or KITE_API_KEY');
            console.log('  ERROR|Invalid Sender ID   → KITE_SENDER_ID not approved/whitelisted');
            console.log('  ERROR|Invalid Template    → KITE_TEMPLATE_ID mismatch with message content');
            console.log('  ERROR|Insufficient balance → KiteSMS account has no credits');
        } else {
            console.log('\nRESULT: SUCCESS — MessageID:', res.data);
        }
    } catch (e) {
        console.log('NETWORK ERROR:', e.message);
        if (e.code === 'ECONNREFUSED') console.log('  → Cannot reach bulk.kitesms.com (check internet)');
        if (e.code === 'ETIMEDOUT')    console.log('  → KiteSMS request timed out');
    }
}

main().catch(e => console.error('FATAL:', e.message));
