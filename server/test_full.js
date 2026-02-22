/**
 * COMPREHENSIVE API TEST SUITE — Vignan Thrift Society
 * Tests ALL routes including file uploads, credential downloads, reports, edge cases.
 * Usage: node test_full.js
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const BASE = 'http://localhost:5000/api';
let adminToken = '';
let employeeToken = '';
let testEmpMongoId = '';
let createdTestEmpId = '';
let createdTestCreds = null;
let results = [];

// ── Helpers ──

async function req(method, urlPath, body = null, token = null, isBinary = false) {
    const opts = { method, headers: {} };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body && !(body instanceof Buffer)) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
    }
    if (body instanceof Buffer) {
        // Already set content-type externally
    }
    const res = await fetch(`${BASE}${urlPath}`, opts);
    const ct = res.headers.get('content-type') || '';
    if (isBinary) {
        const buf = await res.arrayBuffer();
        return { status: res.status, size: buf.byteLength, ct, buffer: Buffer.from(buf) };
    }
    let data;
    try { data = await res.json(); } catch { data = null; }
    return { status: res.status, data, ct };
}

function buildMultipart(fieldName, fileName, fileBuffer, contentType) {
    const boundary = '----TestBoundary' + Date.now();
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\nContent-Type: ${contentType}\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(header), fileBuffer, Buffer.from(footer)]);
    return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

async function uploadFile(urlPath, filePath, token) {
    const buf = fs.readFileSync(filePath);
    const fname = path.basename(filePath);
    const mp = buildMultipart('file', fname, buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const res = await fetch(`${BASE}${urlPath}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': mp.contentType,
        },
        body: mp.body,
    });
    let data;
    try { data = await res.json(); } catch { data = null; }
    return { status: res.status, data };
}

function pass(name, ok, detail = '') {
    const icon = ok ? '✅' : '❌';
    console.log(`  ${icon} ${name}${detail ? `  →  ${detail}` : ''}`);
    results.push({ name, ok });
}

function section(title) { console.log(`\n─── ${title} ───`); }

// ── Main ──

async function run() {
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  VIGNAN THRIFT SOCIETY — FULL API TEST SUITE     ║');
    console.log('╚══════════════════════════════════════════════════╝');

    // ═══════════════════════════════════════
    // 1. AUTHENTICATION
    // ═══════════════════════════════════════
    section('1. AUTHENTICATION');

    let r = await req('POST', '/auth/login', { username: 'admin', password: 'admin123' });
    pass('Admin login', r.status === 200 && !!r.data?.token, `token=${!!r.data?.token}`);
    adminToken = r.data?.token || '';

    r = await req('POST', '/auth/login', { username: 'admin', password: 'wrongpass' });
    pass('Invalid login rejected', r.status === 401, `status=${r.status}`);

    r = await req('POST', '/auth/login', {});
    pass('Empty credentials rejected', r.status === 401 || r.status === 400, `status=${r.status}`);

    r = await req('GET', '/admin/dashboard', null, null);
    pass('Unauthenticated request rejected', r.status === 401, `status=${r.status}`);

    // ═══════════════════════════════════════
    // 2. ADMIN DASHBOARD
    // ═══════════════════════════════════════
    section('2. ADMIN DASHBOARD');

    r = await req('GET', '/admin/dashboard', null, adminToken);
    pass('Dashboard stats', r.status === 200 && r.data?.totalEmployees > 0, 
        `employees=${r.data?.totalEmployees}, thrift=₹${r.data?.totalThrift}, activeLoans=${r.data?.activeLoans}`);

    // ═══════════════════════════════════════
    // 3. EMPLOYEE CRUD
    // ═══════════════════════════════════════
    section('3. EMPLOYEE CRUD');

    // Clean up from previous runs
    r = await req('GET', '/admin/employees', null, adminToken);
    pass('List employees', r.status === 200 && Array.isArray(r.data), `count=${r.data?.length}`);
    if (r.data?.length > 0) testEmpMongoId = r.data[0]._id;

    const priorTest = r.data?.find(e => e.email === 'fulltest@vignan.ac.in');
    if (priorTest) await req('DELETE', `/admin/employees/${priorTest._id}`, null, adminToken);

    // Create employee
    r = await req('POST', '/admin/employees', {
        name: 'Full Test Employee',
        email: 'fulltest@vignan.ac.in',
        department: 'QA',
        designation: 'Tester',
        salary: 45000,
        thriftContribution: 800,
    }, adminToken);
    pass('Create employee', r.status === 201, `status=${r.status}`);
    createdTestEmpId = r.data?.employee?._id || r.data?._id;
    createdTestCreds = r.data?.tempCredentials;
    pass('Credentials returned on create', !!createdTestCreds?.username && !!createdTestCreds?.password,
        `username=${createdTestCreds?.username}`);

    // Get single
    if (createdTestEmpId) {
        r = await req('GET', `/admin/employees/${createdTestEmpId}`, null, adminToken);
        pass('Get single employee', r.status === 200 && r.data?.name === 'Full Test Employee', `name=${r.data?.name}`);
    }

    // Update
    if (createdTestEmpId) {
        r = await req('PUT', `/admin/employees/${createdTestEmpId}`, {
            salary: 48000, designation: 'Senior Tester'
        }, adminToken);
        pass('Update employee', r.status === 200, `status=${r.status}`);
    }

    // ═══════════════════════════════════════
    // 4. EMPLOYEE EXCEL UPLOAD (with credentials)
    // ═══════════════════════════════════════
    section('4. EMPLOYEE EXCEL UPLOAD + CREDENTIALS');

    // Create a small test Excel with employee data
    const empData = [
        { Name: 'TestUpload One', Email: 'testup1@vignan.ac.in', Department: 'IT', Designation: 'Dev', Phone: '9876543210', Salary: 30000, Thrift: 500 },
        { Name: 'TestUpload Two', Email: 'testup2@vignan.ac.in', Department: 'HR', Designation: 'Manager', Phone: '9876543211', Salary: 35000, Thrift: 600 },
        { Name: 'TestUpload Three', Email: 'testup3@vignan.ac.in', Department: 'Finance', Designation: 'Analyst', Phone: '9876543212', Salary: 40000, Thrift: 700 },
    ];

    // Clean up these test employees first
    const allEmps = (await req('GET', '/admin/employees', null, adminToken)).data || [];
    for (const e of empData) {
        const existing = allEmps.find(emp => emp.email === e.Email);
        if (existing) await req('DELETE', `/admin/employees/${existing._id}`, null, adminToken);
    }

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(empData);
    xlsx.utils.book_append_sheet(wb, ws, 'Employees');
    const testEmpExcelPath = path.join(__dirname, 'test_employees_upload.xlsx');
    xlsx.writeFile(wb, testEmpExcelPath);

    r = await uploadFile('/admin/upload/employees', testEmpExcelPath, adminToken);
    pass('Employee Excel upload', r.status === 201 && r.data?.log, 
        `success=${r.data?.log?.successCount}, failed=${r.data?.log?.failureCount}`);
    
    const uploadedCreds = r.data?.createdUsers;
    pass('Credentials generated for uploaded employees', 
        Array.isArray(uploadedCreds) && uploadedCreds.length === 3,
        `credCount=${uploadedCreds?.length}`);

    // Simulate credential CSV download (same logic as frontend)
    if (uploadedCreds && uploadedCreds.length > 0) {
        const headers = ['Email', 'Password', 'EmployeeID'];
        const rows = uploadedCreds.map(u => [u.email, u.password, u.employeeId]);
        const csvLines = [headers.join(','), ...rows.map(r => r.join(','))];
        const csvContent = csvLines.join('\n');
        
        const csvPath = path.join(__dirname, 'test_credentials_download.csv');
        fs.writeFileSync(csvPath, csvContent);
        
        const csvExists = fs.existsSync(csvPath);
        const csvData = csvExists ? fs.readFileSync(csvPath, 'utf8') : '';
        const csvRowCount = csvData.trim().split('\n').length - 1; // minus header
        
        pass('Credentials CSV download', csvExists && csvRowCount === 3,
            `file=${csvPath}, rows=${csvRowCount}`);
        console.log('    📄 Credential CSV contents:');
        csvLines.forEach(line => console.log(`       ${line}`));
        
        // Clean up
        if (csvExists) fs.unlinkSync(csvPath);
    }
    
    // Clean up test Excel
    if (fs.existsSync(testEmpExcelPath)) fs.unlinkSync(testEmpExcelPath);

    // ═══════════════════════════════════════
    // 5. MONTHLY UPLOAD (Book1.xlsx)
    // ═══════════════════════════════════════
    section('5. MONTHLY UPLOAD (Book1.xlsx)');

    const book1Path = path.join(__dirname, '..', 'Book1.xlsx');
    if (fs.existsSync(book1Path)) {
        r = await uploadFile('/admin/upload/monthly', book1Path, adminToken);
        pass('Monthly upload (Book1.xlsx)', r.status === 201 && r.data?.log,
            `success=${r.data?.log?.successCount}, failed=${r.data?.log?.failureCount}, status=${r.data?.log?.status}`);
        
        if (r.data?.warnings?.length > 0) {
            console.log(`    ⚠️  Warnings (${r.data.warnings.length}):`);
            r.data.warnings.slice(0, 5).forEach(w => console.log(`       ${w}`));
        }
        if (r.data?.log?.errorLog?.length > 0) {
            console.log(`    ❗ Errors (${r.data.log.errorLog.length}):`);
            r.data.log.errorLog.slice(0, 5).forEach(e => console.log(`       Row ${e.row}: ${e.error}`));
        }
    } else {
        pass('Monthly upload (Book1.xlsx)', false, 'Book1.xlsx not found!');
    }

    // ═══════════════════════════════════════
    // 6. REPORTS & DOWNLOADS
    // ═══════════════════════════════════════
    section('6. REPORTS & DOWNLOADS');

    // Monthly report download
    r = await req('GET', '/admin/reports/monthly/2025-10', null, adminToken, true);
    pass('Monthly report Excel download', r.status === 200 && r.size > 5000,
        `size=${(r.size/1024).toFixed(1)}KB`);
    
    // Verify it's a valid Excel
    if (r.status === 200 && r.buffer) {
        try {
            const reportWb = xlsx.read(r.buffer);
            const sheetNames = reportWb.SheetNames;
            pass('Monthly report is valid Excel', sheetNames.length > 0, `sheets=${sheetNames.join(',')}`);
        } catch { pass('Monthly report is valid Excel', false, 'Parse error'); }
    }

    // Yearly report download
    r = await req('GET', '/admin/reports/yearly/2025', null, adminToken, true);
    pass('Yearly report Excel download', r.status === 200 && r.size > 5000,
        `size=${(r.size/1024).toFixed(1)}KB`);
    
    if (r.status === 200 && r.buffer) {
        try {
            const reportWb = xlsx.read(r.buffer);
            pass('Yearly report is valid Excel', reportWb.SheetNames.length > 0, `sheets=${reportWb.SheetNames.join(',')}`);
        } catch { pass('Yearly report is valid Excel', false, 'Parse error'); }
    }

    // Individual employee monthly report
    if (testEmpMongoId) {
        r = await req('GET', `/admin/employees/${testEmpMongoId}/report/monthly/2025-10`, null, adminToken, true);
        pass('Employee monthly report download', r.status === 200 && r.size > 1000,
            `size=${(r.size/1024).toFixed(1)}KB`);

        r = await req('GET', `/admin/employees/${testEmpMongoId}/report/yearly/2025`, null, adminToken, true);
        pass('Employee yearly report download', r.status === 200 && r.size > 1000,
            `size=${(r.size/1024).toFixed(1)}KB`);
    }

    // Non-existent month report (should still work, just empty)
    r = await req('GET', '/admin/reports/monthly/2020-01', null, adminToken, true);
    pass('Empty month report (no data)', r.status === 200, `size=${r.size}B`);

    // ═══════════════════════════════════════
    // 7. ADJUSTMENTS
    // ═══════════════════════════════════════
    section('7. SALARY & THRIFT ADJUSTMENTS');

    if (testEmpMongoId) {
        r = await req('POST', `/admin/employees/${testEmpMongoId}/adjust-salary`, {
            newSalary: 65000, reason: 'Annual increment'
        }, adminToken);
        pass('Adjust salary', r.status === 200, `status=${r.status}`);

        r = await req('POST', `/admin/employees/${testEmpMongoId}/adjust-thrift`, {
            newThriftContribution: 2000, reason: 'Increased contribution'
        }, adminToken);
        pass('Adjust thrift contribution', r.status === 200, `status=${r.status}`);

        r = await req('GET', `/admin/employees/${testEmpMongoId}/history`, null, adminToken);
        pass('Adjustment history', r.status === 200 && Array.isArray(r.data) && r.data.length > 0,
            `count=${r.data?.length}`);

        r = await req('GET', `/admin/employees/${testEmpMongoId}/transactions`, null, adminToken);
        pass('Employee transactions (admin view)', r.status === 200 && Array.isArray(r.data),
            `count=${r.data?.length}`);
    }

    // ═══════════════════════════════════════
    // 8. LOANS
    // ═══════════════════════════════════════
    section('8. LOAN MANAGEMENT');

    r = await req('GET', '/loans', null, adminToken);
    pass('List loans', r.status === 200 && Array.isArray(r.data), `count=${r.data?.length}`);

    let testLoanId = null;
    if (testEmpMongoId) {
        r = await req('POST', '/loans', {
            borrowerId: testEmpMongoId,
            loanAmount: 100000,
            interestRate: 6,
            emi: 10000,
            sureties: [],
        }, adminToken);
        pass('Create loan', r.status === 201 || r.status === 200, `status=${r.status}`);
        testLoanId = r.data?._id;

        // Verify employee has active loan
        if (testLoanId) {
            r = await req('GET', `/admin/employees/${testEmpMongoId}`, null, adminToken);
            pass('Employee has active loan after creation', !!r.data?.activeLoan,
                `loanId=${r.data?.activeLoan?._id || r.data?.activeLoan}`);

            r = await req('PUT', `/loans/${testLoanId}/close`, null, adminToken);
            pass('Close loan', r.status === 200, `status=${r.status}`);
        }
    }

    // ═══════════════════════════════════════
    // 9. YEARLY THRIFT UPDATE
    // ═══════════════════════════════════════
    section('9. YEARLY THRIFT UPDATE');

    r = await req('POST', '/admin/yearly-thrift-update', {
        year: 2025,
        shareCapital: 500000,
        bankBalance: 300000,
        cashInHand: 50000,
    }, adminToken);
    pass('Yearly thrift update', r.status === 200 && r.data?.results?.length > 0,
        `employees=${r.data?.results?.length}, formula=${r.data?.formula ? 'present' : 'missing'}`);
    
    if (r.data?.results?.length > 0) {
        const sample = r.data.results[0];
        console.log(`    📊 Sample result: ${sample.name} → dividend=₹${sample.dividend}, balance=₹${sample.newBalance}`);
    }

    // ═══════════════════════════════════════
    // 10. EMPLOYEE ROUTES (as employee user)
    // ═══════════════════════════════════════
    section('10. EMPLOYEE ROUTES');

    // Login with the employee we created above
    if (createdTestCreds) {
        r = await req('POST', '/auth/login', { 
            username: createdTestCreds.username, 
            password: createdTestCreds.password 
        });
        pass('Employee login', r.status === 200 && !!r.data?.token, `status=${r.status}`);
        employeeToken = r.data?.token || '';
        
        if (employeeToken) {
            r = await req('GET', '/employee/me', null, employeeToken);
            pass('GET /employee/me (profile)', r.status === 200 && r.data?.name,
                `name=${r.data?.name}, salary=${r.data?.salary}`);

            r = await req('GET', '/employee/dashboard', null, employeeToken);
            pass('GET /employee/dashboard', r.status === 200,
                `keys=${Object.keys(r.data || {}).join(',')}`);

            r = await req('GET', '/employee/transactions', null, employeeToken);
            pass('GET /employee/transactions', r.status === 200 && Array.isArray(r.data),
                `count=${r.data?.length}`);

            r = await req('GET', '/employee/loan', null, employeeToken);
            pass('GET /employee/loan', r.status === 200, `hasLoan=${!!r.data?.loanAmount}`);

            r = await req('GET', '/employee/sureties', null, employeeToken);
            pass('GET /employee/sureties', r.status === 200, `count=${r.data?.length || 0}`);

            // Employee should NOT access admin routes
            r = await req('GET', '/admin/dashboard', null, employeeToken);
            pass('Employee blocked from admin routes', r.status === 403 || r.status === 401,
                `status=${r.status}`);
        }
    } else {
        pass('Employee login', false, 'No credentials from createEmployee');
    }

    // Test with uploaded employee credentials too
    if (uploadedCreds && uploadedCreds.length > 0) {
        const cred = uploadedCreds[0];
        r = await req('POST', '/auth/login', { username: cred.email, password: cred.password });
        pass('Uploaded employee login', r.status === 200 && !!r.data?.token, 
            `email=${cred.email}, status=${r.status}`);
        
        if (r.data?.token) {
            r = await req('GET', '/employee/me', null, r.data.token);
            pass('Uploaded employee profile', r.status === 200 && r.data?.name, `name=${r.data?.name}`);
        }
    }

    // ═══════════════════════════════════════
    // 11. CHANGE PASSWORD
    // ═══════════════════════════════════════
    section('11. CHANGE PASSWORD');

    if (createdTestCreds) {
        // Login first to get userId
        r = await req('POST', '/auth/login', { username: createdTestCreds.username, password: createdTestCreds.password });
        if (r.data?._id) {
            const userId = r.data._id;
            r = await req('POST', '/auth/change-password', { userId, newPassword: 'newpass123' });
            pass('Change password', r.status === 200, `status=${r.status}`);

            // Login with new password
            r = await req('POST', '/auth/login', { username: createdTestCreds.username, password: 'newpass123' });
            pass('Login with new password', r.status === 200 && !!r.data?.token, `status=${r.status}`);
        }
    }

    // ═══════════════════════════════════════
    // 12. EDGE CASES & ERROR HANDLING
    // ═══════════════════════════════════════
    section('12. EDGE CASES');

    // Invalid employee ID
    r = await req('GET', '/admin/employees/000000000000000000000000', null, adminToken);
    pass('Get non-existent employee', r.status === 404 || r.status === 500, `status=${r.status}`);

    // Update non-existent employee
    r = await req('PUT', '/admin/employees/000000000000000000000000', { salary: 100 }, adminToken);
    pass('Update non-existent employee', r.status === 404 || r.status === 500, `status=${r.status}`);

    // Create duplicate employee
    r = await req('POST', '/admin/employees', {
        name: 'Duplicate',
        email: 'fulltest@vignan.ac.in', // already exists
        department: 'Test',
    }, adminToken);
    pass('Duplicate employee rejected', r.status === 400, `status=${r.status}`);

    // ═══════════════════════════════════════
    // 13. CLEANUP
    // ═══════════════════════════════════════
    section('13. CLEANUP');

    // Delete test employees
    const empList = (await req('GET', '/admin/employees', null, adminToken)).data || [];
    const testEmails = ['fulltest@vignan.ac.in', 'testup1@vignan.ac.in', 'testup2@vignan.ac.in', 'testup3@vignan.ac.in'];
    let deleted = 0;
    for (const email of testEmails) {
        const emp = empList.find(e => e.email === email);
        if (emp) {
            r = await req('DELETE', `/admin/employees/${emp._id}`, null, adminToken);
            if (r.status === 200) deleted++;
        }
    }
    pass('Cleanup test employees', deleted >= 1, `deleted=${deleted}`);

    // ═══════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════
    const passed = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok).length;

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log(`║  RESULTS: ${passed} PASSED, ${failed} FAILED (${results.length} total)`.padEnd(51) + '║');
    console.log('╚══════════════════════════════════════════════════╝');
    
    if (failed > 0) {
        console.log('\nFailed tests:');
        results.filter(r => !r.ok).forEach(r => console.log(`  ❌ ${r.name}`));
    }
    console.log('');
}

run().catch(err => {
    console.error('\n💥 Test runner crashed:', err.message);
    console.error(err.stack);
    process.exit(1);
});
