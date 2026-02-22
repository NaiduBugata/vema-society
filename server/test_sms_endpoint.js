require('dotenv').config();
const axios = require('axios');

const BASE = 'http://localhost:5000/api';

async function main() {
    // 1. Login
    let res = await axios.post(`${BASE}/auth/login`, { username: 'admin', password: 'admin1' });
    const token = res.data.token;
    console.log('Login:', res.status, token ? '✅ got token' : '❌ NO TOKEN');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Check what month has transactions
    res = await axios.get(`${BASE}/admin/reports/monthly-history`, { headers });
    const logs = res.data;
    console.log('\nMonthly upload history:', JSON.stringify(logs?.map(l => l.month || l), null, 2));

    const month = (logs && logs[0]) ? (logs[0].month || logs[0]) : '2025-11';
    console.log('\nTesting SMS for month:', month);

    // 3. Call SMS endpoint
    try {
        res = await axios.post(`${BASE}/admin/notify/monthly-sms`,
            { month, dividend: 0 },
            { headers }
        );
        console.log('\n✅ SMS endpoint status:', res.status);
        console.log('sent    :', res.data.sent);
        console.log('total   :', res.data.total);
        console.log('errors  :', res.data.errors?.length || 0);
        if (res.data.errors?.length > 0) {
            console.log('\nFirst 5 errors:');
            res.data.errors.slice(0, 5).forEach((e, i) =>
                console.log(`  [${i+1}] ${e.name} | phone: ${e.phone} | error: ${e.error}`)
            );
        }
    } catch (e) {
        console.log('\n❌ SMS endpoint FAILED');
        console.log('Status:', e.response?.status);
        console.log('Error :', e.response?.data || e.message);
    }
}

main().catch(e => console.error('FATAL:', e.message));
