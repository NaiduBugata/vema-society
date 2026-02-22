/**
 * TEST: Employee Upload — All Fields, Loan Section & Credential Generation
 * 
 * Covers:
 *  1. Simple format Excel (Name, Email, Department, Designation, Phone, Salary, Thrift)
 *  2. Vignan format Excel (Emp. ID, Name of the Employ, CB Thrift Amount As on,
 *     Monthly Threft Amount, Loan, Loan Re payment, Intrest, Total  Amount, etc.)
 *  3. Verifies all Employee model fields are saved correctly
 *  4. Verifies loan status flag is captured (loanStatus field)
 *  5. Verifies createdUsers credentials are returned (empId, name, username, password)
 *  6. Verifies CSV download logic produces correct output for all credential rows
 *  7. Verifies duplicate upload skips existing employees
 *  8. Verifies employee can login with returned credentials
 *
 * Usage:  node test_upload_credentials.js
 * Requires server running on localhost:5000
 */

const fs   = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const BASE = 'http://localhost:5000/api';

// ─── helpers ─────────────────────────────────────────────────────────────────

let passed = 0, failed = 0;

function pass(label, ok, detail = '') {
    if (ok) {
        passed++;
        console.log(`  ✅ PASS  ${label}${detail ? '  →  ' + detail : ''}`);
    } else {
        failed++;
        console.log(`  ❌ FAIL  ${label}${detail ? '  →  ' + detail : ''}`);
    }
}

function section(title) {
    console.log(`\n${'═'.repeat(55)}`);
    console.log(`  ${title}`);
    console.log('═'.repeat(55));
}

async function req(method, urlPath, body = null, token = null) {
    const opts = { method, headers: {} };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
    }
    const res = await fetch(`${BASE}${urlPath}`, opts);
    let data;
    try { data = await res.json(); } catch { data = null; }
    return { status: res.status, data };
}

function buildMultipart(fieldName, fileName, fileBuffer) {
    const boundary = '----TestBoundary' + Date.now();
    const header   = `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`;
    const footer   = `\r\n--${boundary}--\r\n`;
    return {
        body: Buffer.concat([Buffer.from(header), fileBuffer, Buffer.from(footer)]),
        contentType: `multipart/form-data; boundary=${boundary}`
    };
}

async function uploadXlsx(urlPath, filePath, token) {
    const fileBuffer = fs.readFileSync(filePath);
    const { body, contentType } = buildMultipart('file', path.basename(filePath), fileBuffer);
    const res = await fetch(`${BASE}${urlPath}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': contentType },
        body
    });
    let data;
    try { data = await res.json(); } catch { data = null; }
    return { status: res.status, data };
}

function makeTmpFile(name) {
    return path.join(__dirname, name);
}

function cleanupFiles(...files) {
    files.forEach(f => { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} });
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function run() {
    console.log('\n══════════════════════════════════════════════════════');
    console.log('  UPLOAD + CREDENTIALS TEST SUITE');
    console.log('══════════════════════════════════════════════════════');

    // ── Admin login ───────────────────────────────────────────────────────────
    section('0. Admin Login');
    let r = await req('POST', '/auth/login', { username: 'admin', password: 'admin123' });
    pass('Admin login', r.status === 200 && !!r.data?.token,
        `status=${r.status}, token=${r.data?.token ? 'present' : 'MISSING'}`);

    if (!r.data?.token) {
        console.log('\n⛔  Cannot continue without admin token — is the server running?\n');
        process.exit(1);
    }
    const adminToken = r.data.token;

    // Clean up test employees from previous runs so upload always creates fresh ones
    const SIMPLE_EMAILS = [
        'upload.test1@vignan.ac.in',
        'upload.test2@vignan.ac.in',
        'upload.test3@vignan.ac.in'
    ];
    const VIGNAN_EMPIDS = ['UC001', 'UC002', 'UC003'];

    section('1. Pre-test cleanup');
    r = await req('GET', '/admin/employees', null, adminToken);
    if (r.status === 200 && Array.isArray(r.data)) {
        for (const emp of r.data) {
            const shouldDelete =
                SIMPLE_EMAILS.includes(emp.email) ||
                VIGNAN_EMPIDS.includes(String(emp.empId));
            if (shouldDelete) {
                await req('DELETE', `/admin/employees/${emp._id}`, null, adminToken);
                console.log(`  🗑  Deleted prior test employee: ${emp.name} (${emp.empId || emp.email})`);
            }
        }
    }
    console.log('  Pre-cleanup done.');

    // ─────────────────────────────────────────────────────────────────────────
    section('2. SIMPLE FORMAT UPLOAD (Name, Email, Dept, Designation, Phone, Salary, Thrift)');

    const simpleData = [
        { Name: 'UploadTest One',   Email: 'upload.test1@vignan.ac.in', Department: 'IT',      Designation: 'Developer',  Phone: '9000000001', Salary: 30000, Thrift: 500  },
        { Name: 'UploadTest Two',   Email: 'upload.test2@vignan.ac.in', Department: 'HR',      Designation: 'Manager',    Phone: '9000000002', Salary: 35000, Thrift: 600  },
        { Name: 'UploadTest Three', Email: 'upload.test3@vignan.ac.in', Department: 'Finance', Designation: 'Analyst',    Phone: '9000000003', Salary: 40000, Thrift: 700  },
    ];
    const simpleFile = makeTmpFile('_test_simple_upload.xlsx');
    const wb1 = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb1, xlsx.utils.json_to_sheet(simpleData), 'Employees');
    xlsx.writeFile(wb1, simpleFile);

    r = await uploadXlsx('/admin/upload/employees', simpleFile, adminToken);
    pass('Simple format — HTTP 201', r.status === 201, `status=${r.status}`);
    pass('Simple format — log present', !!r.data?.log, `log=${JSON.stringify(r.data?.log)}`);
    pass('Simple format — successCount === 3', r.data?.log?.successCount === 3,
        `successCount=${r.data?.log?.successCount}, failureCount=${r.data?.log?.failureCount}`);

    // Credentials
    const simpleCreds = r.data?.createdUsers;
    pass('Simple format — createdUsers array present', Array.isArray(simpleCreds) && simpleCreds.length === 3,
        `count=${simpleCreds?.length}`);

    if (Array.isArray(simpleCreds) && simpleCreds.length > 0) {
        const c = simpleCreds[0];
        pass('Credential has name',     !!c.name,     `name="${c.name}"`);
        pass('Credential has empId',    'empId' in c, `empId="${c.empId}"`);
        pass('Credential has username', !!c.username, `username="${c.username}"`);
        pass('Credential has password', !!c.password && c.password.length >= 6,
            `password="${c.password}"`);

        console.log('\n  📋 Sample credentials from simple upload:');
        simpleCreds.forEach(u =>
            console.log(`     Emp: ${u.empId}  |  ${u.name}  →  username: ${u.username}  password: ${u.password}`)
        );
    }

    // Verify employee fields in DB
    r = await req('GET', '/admin/employees', null, adminToken);
    const savedEmp = r.data?.find(e => e.email === 'upload.test1@vignan.ac.in');
    pass('Employee saved to DB', !!savedEmp, `found=${!!savedEmp}`);
    if (savedEmp) {
        pass('Field: salary saved',      savedEmp.salary      === 30000, `salary=${savedEmp.salary}`);
        pass('Field: thriftContribution', savedEmp.thriftContribution === 500, `thriftContribution=${savedEmp.thriftContribution}`);
        pass('Field: department',        savedEmp.department  === 'IT',   `department=${savedEmp.department}`);
        pass('Field: designation',       savedEmp.designation === 'Developer', `designation=${savedEmp.designation}`);
        pass('Field: phone',             savedEmp.phone       === '9000000001', `phone=${savedEmp.phone}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    section('3. VIGNAN FORMAT UPLOAD (Emp. ID, CB Thrift, Monthly Threft, Loan column)');

    // Build a Vignan-style header row (matches what real files look like)
    const vignanHeaders = [
        'Emp. ID',
        'Name of the Employ',
        'CB Thrift Amount As on',
        'Loan',
        'Loan Re payment',
        'Intrest',
        'Monthly Threft Amount',
        'Total  Amount',
        'Paid Amount',
        'Loan Amount',
        'Thrift',
        'Total monthly deduction'
    ];
    const vignanRows = [
        // Has loan (Loan col > 0 → loanStatus = 'Loan')
        ['UC001', 'Vignan TestEmp A', 15000, 50000, 2000, 500, 800, 68300, 5000, 48000, 800, 2800],
        // No loan
        ['UC002', 'Vignan TestEmp B', 22000, 0,     0,    0,   600, 22600, 0,    0,     600, 600 ],
        // Has loan
        ['UC003', 'Vignan TestEmp C', 9500,  30000, 1500, 300, 500, 41300, 3000, 28500, 500, 2000],
    ];

    const wb2 = xlsx.utils.book_new();
    const wsData = [vignanHeaders, ...vignanRows];
    const ws2 = xlsx.utils.aoa_to_sheet(wsData);
    xlsx.utils.book_append_sheet(wb2, ws2, 'Sheet1');
    const vignanFile = makeTmpFile('_test_vignan_upload.xlsx');
    xlsx.writeFile(wb2, vignanFile);

    r = await uploadXlsx('/admin/upload/employees', vignanFile, adminToken);
    pass('Vignan format — HTTP 201', r.status === 201, `status=${r.status}`);
    pass('Vignan format — successCount === 3', r.data?.log?.successCount === 3,
        `successCount=${r.data?.log?.successCount}, failureCount=${r.data?.log?.failureCount}, errors=${JSON.stringify(r.data?.log?.errorLog)}`);

    const vignanCreds = r.data?.createdUsers;
    pass('Vignan format — createdUsers count === 3', Array.isArray(vignanCreds) && vignanCreds.length === 3,
        `count=${vignanCreds?.length}`);

    if (Array.isArray(vignanCreds) && vignanCreds.length > 0) {
        console.log('\n  📋 Sample credentials from Vignan upload:');
        vignanCreds.forEach(u =>
            console.log(`     EmpID: ${u.empId}  |  ${u.name}  →  username: ${u.username}  password: ${u.password}`)
        );
        pass('Vignan cred username = empId', vignanCreds[0].username === 'UC001',
            `username="${vignanCreds[0].username}"`);
    }

    // Verify Vignan employee fields in DB
    r = await req('GET', '/admin/employees', null, adminToken);
    const vigEmpA = r.data?.find(e => String(e.empId) === 'UC001');
    const vigEmpB = r.data?.find(e => String(e.empId) === 'UC002');

    pass('Vignan Employee A in DB', !!vigEmpA, `found=${!!vigEmpA}`);
    if (vigEmpA) {
        pass('Field: thriftBalance (cbThrift)', vigEmpA.thriftBalance === 15000,
            `thriftBalance=${vigEmpA.thriftBalance}`);
        pass('Field: thriftContribution (monthly)', vigEmpA.thriftContribution === 800,
            `thriftContribution=${vigEmpA.thriftContribution}`);
        pass('Field: loanStatus = Loan (loan col > 0)', vigEmpA.loanStatus === 'Loan',
            `loanStatus="${vigEmpA.loanStatus}"`);
    }
    if (vigEmpB) {
        pass('Field: loanStatus empty (loan col = 0)', vigEmpB.loanStatus === '' || !vigEmpB.loanStatus,
            `loanStatus="${vigEmpB.loanStatus}"`);
        pass('Field: thriftBalance for B', vigEmpB.thriftBalance === 22000,
            `thriftBalance=${vigEmpB.thriftBalance}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    section('4. CSV CREDENTIAL DOWNLOAD LOGIC (mimics frontend downloadCredentials)');

    const allCreds = [...(simpleCreds || []), ...(vignanCreds || [])];
    pass('Total credentials collected', allCreds.length === 6, `total=${allCreds.length}`);

    if (allCreds.length > 0) {
        // Replicate the fixed frontend downloadCredentials logic
        const headers = ['Emp ID', 'Name', 'Username', 'Password'];
        const rows = allCreds.map(u => [u.empId, u.name, u.username || u.empId, u.password]);
        const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const csvContent = [
            headers.map(escape).join(','),
            ...rows.map(r2 => r2.map(escape).join(','))
        ].join('\n');

        const csvFile = makeTmpFile('_test_creds_output.csv');
        // Use Blob-equivalent: write to file via Buffer
        const buf = Buffer.from(csvContent, 'utf-8');
        fs.writeFileSync(csvFile, buf);

        pass('CSV file written without error', fs.existsSync(csvFile));
        const lines = fs.readFileSync(csvFile, 'utf-8').trim().split('\n');
        pass('CSV has header row',           lines[0].includes('"Emp ID"'),        `header="${lines[0]}"`);
        pass('CSV row count matches creds',  lines.length === allCreds.length + 1, `rows=${lines.length - 1}, expected=${allCreds.length}`);

        // Check special chars don't break CSV — password contains only alphanum so safe,
        // but we also test a name with a comma
        const commaRows = [{ empId: 'X1', name: 'Smith, John', username: 'X1', password: 'p@ss#1' }];
        const commaLine = commaRows.map(u => [u.empId, u.name, u.username, u.password].map(escape).join(','))[0];
        pass('Names with commas are quoted correctly', commaLine === '"X1","Smith, John","X1","p@ss#1"',
            `line="${commaLine}"`);
        pass('Passwords with special chars safe',
            !commaLine.split(',').some((cell, i) => i === 3 && !cell.startsWith('"')),
            `password cell="${commaLine.split(',')[3]}"`);

        console.log('\n  📄 First 4 CSV lines:');
        lines.slice(0, 4).forEach(l => console.log(`     ${l}`));

        cleanupFiles(csvFile);
    }

    // ─────────────────────────────────────────────────────────────────────────
    section('5. DUPLICATE UPLOAD — should skip all, return skippedExisting');

    r = await uploadXlsx('/admin/upload/employees', simpleFile, adminToken);
    pass('Duplicate upload — HTTP 201', r.status === 201, `status=${r.status}`);
    pass('Duplicate upload — successCount = 0', r.data?.log?.successCount === 0,
        `successCount=${r.data?.log?.successCount}`);
    pass('Duplicate upload — skippedExisting count = 3',
        Array.isArray(r.data?.skippedExisting) && r.data.skippedExisting.length === 3,
        `skipped=${r.data?.skippedExisting?.length}`);
    pass('Duplicate upload — createdUsers empty',
        Array.isArray(r.data?.createdUsers) && r.data.createdUsers.length === 0,
        `createdUsers=${r.data?.createdUsers?.length}`);

    // ─────────────────────────────────────────────────────────────────────────
    section('6. EMPLOYEE LOGIN with uploaded credentials');

    if (Array.isArray(simpleCreds) && simpleCreds.length > 0) {
        for (const cred of simpleCreds.slice(0, 2)) {
            r = await req('POST', '/auth/login', { username: cred.username, password: cred.password });
            pass(`Login: ${cred.name}`, r.status === 200 && !!r.data?.token,
                `username="${cred.username}" status=${r.status}`);
        }
    }
    if (Array.isArray(vignanCreds) && vignanCreds.length > 0) {
        for (const cred of vignanCreds.slice(0, 2)) {
            r = await req('POST', '/auth/login', { username: cred.username, password: cred.password });
            pass(`Login Vignan: ${cred.name}`, r.status === 200 && !!r.data?.token,
                `username="${cred.username}" status=${r.status}`);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    section('7. LOAN STATUS via Employee Details endpoint');

    r = await req('GET', '/admin/employees', null, adminToken);
    const vigEmpAFresh = r.data?.find(e => String(e.empId) === 'UC001');
    if (vigEmpAFresh) {
        const det = await req('GET', `/admin/employees/${vigEmpAFresh._id}`, null, adminToken);
        pass('Employee detail endpoint for loan-flagged employee',
            det.status === 200, `status=${det.status}`);
        pass('loanStatus field accessible via detail endpoint',
            det.data?.loanStatus === 'Loan',
            `loanStatus="${det.data?.loanStatus}"`);
        pass('thriftBalance accessible via detail endpoint',
            det.data?.thriftBalance === 15000,
            `thriftBalance=${det.data?.thriftBalance}`);
        pass('thriftContribution accessible via detail endpoint',
            det.data?.thriftContribution === 800,
            `thriftContribution=${det.data?.thriftContribution}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    section('8. EMAIL — emailsSent returned from upload response');

    // Re-upload simple file with new emails to check emailsSent
    const emailTestData = [
        { Name: 'EmailTest Alpha', Email: 'emailtest.alpha@vignan.ac.in', Department: 'IT', Designation: 'Dev', Salary: 30000, Thrift: 400 },
    ];
    const emailTestFile = makeTmpFile('_test_email_upload.xlsx');
    // cleanup prior
    r = await req('GET', '/admin/employees', null, adminToken);
    const priorAlpha = r.data?.find(e => e.email === 'emailtest.alpha@vignan.ac.in');
    if (priorAlpha) await req('DELETE', `/admin/employees/${priorAlpha._id}`, null, adminToken);

    const wbE = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wbE, xlsx.utils.json_to_sheet(emailTestData), 'Employees');
    xlsx.writeFile(wbE, emailTestFile);

    r = await uploadXlsx('/admin/upload/employees', emailTestFile, adminToken);
    pass('Email upload — HTTP 201', r.status === 201, `status=${r.status}`);

    const emailsReturned = r.data?.emailsSent;
    pass('emailsSent field present in response', typeof emailsReturned === 'number',
        `emailsSent=${emailsReturned}`);
    // Should be at least 1 (admin summary) even if SMTP is misconfigured we only check field presence
    console.log(`     ℹ  emailsSent=${emailsReturned}, emailErrors=${JSON.stringify(r.data?.emailErrors || [])}`);
    if (emailsReturned === 0 && r.data?.emailErrors) {
        console.log('     ⚠  Email delivery failed (SMTP config issue) — field is still returned correctly');
    }

    // ─────────────────────────────────────────────────────────────────────────
    section('9. TEST-EMAIL ENDPOINT (POST /auth/test-email)');

    // Get a valid employee token
    let empTokenForTest = null;
    if (Array.isArray(simpleCreds) && simpleCreds.length > 0) {
        const loginR = await req('POST', '/auth/login', { username: simpleCreds[0].username, password: simpleCreds[0].password });
        empTokenForTest = loginR.data?.token;
    }

    // Admin can call test-email
    r = await req('POST', '/auth/test-email', null, adminToken);
    const testEmailOk = r.status === 200 || (r.status === 500 && r.data?.message?.includes('Failed'));
    pass('Test-email endpoint reachable (admin)', testEmailOk,
        `status=${r.status}, msg="${r.data?.message}"`);
    if (r.status === 200) {
        pass('Test-email success response has message', r.data?.message?.includes('Test email sent'),
            `message="${r.data?.message}"`);
    } else {
        console.log('     ⚠  SMTP send failed — endpoint works but email delivery needs valid credentials');
    }

    // Non-authenticated call should be blocked
    r = await req('POST', '/auth/test-email', null, null);
    pass('Test-email blocked without token', r.status === 401 || r.status === 403,
        `status=${r.status}`);

    cleanupFiles(emailTestFile);

    // ─────────────────────────────────────────────────────────────────────────
    // Cleanup temp xlsx files
    cleanupFiles(simpleFile, vignanFile);

    // ─────────────────────────────────────────────────────────────────────────
    section('RESULTS');
    console.log(`\n  Total:  ${passed + failed}   ✅ Passed: ${passed}   ❌ Failed: ${failed}\n`);
    if (failed > 0) process.exit(1);
}

run().catch(err => {
    console.error('\n⛔  Unhandled error:', err.message);
    process.exit(1);
});
