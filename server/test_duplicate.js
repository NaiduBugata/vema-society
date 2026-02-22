/**
 * Test duplicate handling for employee upload.
 * 1. Upload employees (first time — should all succeed)
 * 2. Upload same file again (should skip all as already existing)  
 * 3. Upload mix of new + existing (should create only new ones)
 */
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const BASE = 'http://localhost:5000/api';
let adminToken = '';

async function uploadFile(urlPath, filePath, token) {
    const buf = fs.readFileSync(filePath);
    const boundary = '----TestBoundary' + Date.now();
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${path.basename(filePath)}"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(header), buf, Buffer.from(footer)]);
    const res = await fetch(`${BASE}${urlPath}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body,
    });
    return { status: res.status, data: await res.json() };
}

async function run() {
    console.log('\n═══ DUPLICATE HANDLING TEST ═══\n');

    // Login
    let r = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    const loginData = await r.json();
    adminToken = loginData.token;

    const testFile = path.join(__dirname, 'test_emp_upload.xlsx');

    // ── TEST 1: First upload (all new) ──
    console.log('── TEST 1: First upload (all should be created) ──');
    let res = await uploadFile('/admin/upload/employees', testFile, adminToken);
    console.log(`  Status: ${res.status}`);
    console.log(`  Created: ${res.data.log?.successCount}`);
    console.log(`  Skipped: ${res.data.skippedExisting?.length || 0}`);
    console.log(`  Failed: ${res.data.log?.failureCount}`);
    console.log(`  Credentials: ${res.data.createdUsers?.length || 0}`);
    if (res.data.createdUsers) {
        res.data.createdUsers.forEach(u => console.log(`    → ${u.email} / ${u.password}`));
    }
    const test1Pass = res.data.log?.successCount === 2 && (res.data.skippedExisting?.length || 0) === 0;
    console.log(`  ${test1Pass ? '✅' : '❌'} PASS\n`);

    // ── TEST 2: Same file again (all should be skipped) ──
    console.log('── TEST 2: Re-upload same file (all should be skipped) ──');
    res = await uploadFile('/admin/upload/employees', testFile, adminToken);
    console.log(`  Status: ${res.status}`);
    console.log(`  Created: ${res.data.log?.successCount}`);
    console.log(`  Skipped: ${res.data.skippedExisting?.length || 0}`);
    console.log(`  Failed: ${res.data.log?.failureCount}`);
    console.log(`  Credentials: ${res.data.createdUsers?.length || 0}`);
    if (res.data.skippedExisting) {
        res.data.skippedExisting.forEach(s => console.log(`    → Row ${s.row}: ${s.name} — ${s.reason}`));
    }
    const test2Pass = res.data.log?.successCount === 0 && res.data.skippedExisting?.length === 2;
    console.log(`  ${test2Pass ? '✅' : '❌'} PASS\n`);

    // ── TEST 3: Mix of new + existing ──
    console.log('── TEST 3: Upload mix (2 existing + 1 new) ──');
    const mixData = [
        { Name: 'Test One', Email: 'test1@vignan.ac.in', Department: 'IT', Salary: 30000, Thrift: 500 },
        { Name: 'Test Two', Email: 'test2@vignan.ac.in', Department: 'HR', Salary: 35000, Thrift: 600 },
        { Name: 'Test Three', Email: 'test3@vignan.ac.in', Department: 'Finance', Salary: 40000, Thrift: 700 },
    ];
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(mixData);
    xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
    const mixFile = path.join(__dirname, 'test_mix_upload.xlsx');
    xlsx.writeFile(wb, mixFile);

    res = await uploadFile('/admin/upload/employees', mixFile, adminToken);
    console.log(`  Status: ${res.status}`);
    console.log(`  Created: ${res.data.log?.successCount}`);
    console.log(`  Skipped: ${res.data.skippedExisting?.length || 0}`);
    console.log(`  Failed: ${res.data.log?.failureCount}`);
    console.log(`  Credentials: ${res.data.createdUsers?.length || 0}`);
    if (res.data.skippedExisting) {
        res.data.skippedExisting.forEach(s => console.log(`    → Skipped: ${s.name} — ${s.reason}`));
    }
    if (res.data.createdUsers) {
        res.data.createdUsers.forEach(u => console.log(`    → Created: ${u.email} / ${u.password}`));
    }
    const test3Pass = res.data.log?.successCount === 1 && res.data.skippedExisting?.length === 2;
    console.log(`  ${test3Pass ? '✅' : '❌'} PASS\n`);

    // Cleanup: delete test employees
    const empList = await (await fetch(`${BASE}/admin/employees`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    })).json();
    for (const email of ['test1@vignan.ac.in', 'test2@vignan.ac.in', 'test3@vignan.ac.in']) {
        const emp = empList.find(e => e.email === email);
        if (emp) {
            await fetch(`${BASE}/admin/employees/${emp._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
        }
    }
    fs.unlinkSync(testFile);
    fs.unlinkSync(mixFile);

    console.log(`═══ OVERALL: ${test1Pass && test2Pass && test3Pass ? '✅ ALL PASSED' : '❌ SOME FAILED'} ═══\n`);
}

run().catch(err => { console.error(err); process.exit(1); });
