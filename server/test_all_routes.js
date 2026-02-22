/**
 * Comprehensive route test script for Vignan Thrift Society API.
 * Tests ALL routes end-to-end.
 * Usage: node test_all_routes.js
 */

const BASE = 'http://localhost:5000/api';
let adminToken = '';
let employeeToken = '';
let testEmployeeId = '';
let testEmpMongoId = '';
let results = [];

async function request(method, path, body = null, token = null, isBinary = false) {
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body && !(body instanceof FormData)) {
        opts.body = JSON.stringify(body);
    }
    if (body instanceof FormData) {
        delete opts.headers['Content-Type'];
        opts.headers['Authorization'] = `Bearer ${token}`;
        opts.body = body;
    }
    
    const res = await fetch(`${BASE}${path}`, opts);
    const contentType = res.headers.get('content-type') || '';
    
    if (isBinary) {
        const buf = await res.arrayBuffer();
        return { status: res.status, size: buf.byteLength, contentType };
    }
    
    let data;
    try {
        data = await res.json();
    } catch {
        data = await res.text().catch(() => null);
    }
    return { status: res.status, data, contentType };
}

function test(name, passed, detail = '') {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}${detail ? ` — ${detail}` : ''}`);
    results.push({ name, passed });
}

async function run() {
    console.log('\n========================================');
    console.log('  VIGNAN THRIFT SOCIETY — ROUTE TESTS');
    console.log('========================================\n');

    // ──── 1. AUTH ROUTES ────
    console.log('── AUTH ──');
    
    // POST /auth/login (admin)
    let r = await request('POST', '/auth/login', { username: 'admin', password: 'admin123' });
    test('POST /auth/login (admin)', r.status === 200 && r.data?.token, `status=${r.status}`);
    if (r.data?.token) adminToken = r.data.token;

    // POST /auth/login (invalid)
    r = await request('POST', '/auth/login', { username: 'admin', password: 'wrong' });
    test('POST /auth/login (invalid)', r.status === 401 || r.status === 400, `status=${r.status}`);

    // ──── 2. ADMIN DASHBOARD ────
    console.log('\n── ADMIN DASHBOARD ──');
    
    r = await request('GET', '/admin/dashboard', null, adminToken);
    test('GET /admin/dashboard', r.status === 200 && r.data !== undefined, `status=${r.status}, keys=${Object.keys(r.data||{}).join(',')}`);

    // ──── 3. ADMIN EMPLOYEES ────
    console.log('\n── ADMIN EMPLOYEES ──');
    
    r = await request('GET', '/admin/employees', null, adminToken);
    test('GET /admin/employees', r.status === 200 && Array.isArray(r.data), `status=${r.status}, count=${r.data?.length}`);
    if (r.data?.length > 0) {
        testEmpMongoId = r.data[0]._id;
        testEmployeeId = r.data[0].empId;
    }

    // GET single employee
    if (testEmpMongoId) {
        r = await request('GET', `/admin/employees/${testEmpMongoId}`, null, adminToken);
        test('GET /admin/employees/:id', r.status === 200 && r.data?.name, `status=${r.status}, name=${r.data?.name}`);
    }

    // Clean up test employee from prior runs
    const existingTest = await request('GET', '/admin/employees', null, adminToken);
    const priorTestEmp = existingTest.data?.find(e => e.email === 'test999@vignan.ac.in');
    if (priorTestEmp) {
        await request('DELETE', `/admin/employees/${priorTestEmp._id}`, null, adminToken);
    }

    // POST create employee
    r = await request('POST', '/admin/employees', {
        name: 'Test Employee',
        email: 'test999@vignan.ac.in',
        department: 'Testing',
        designation: 'Tester',
        salary: 50000,
        thriftContribution: 1000,
    }, adminToken);
    test('POST /admin/employees (create)', r.status === 201, `status=${r.status}`);
    const newEmpId = r.data?._id || r.data?.employee?._id;
    const tempCreds = r.data?.tempCredentials;

    // PUT update employee
    if (newEmpId) {
        r = await request('PUT', `/admin/employees/${newEmpId}`, {
            salary: 55000,
            designation: 'Senior Tester',
        }, adminToken);
        test('PUT /admin/employees/:id (update)', r.status === 200, `status=${r.status}`);
    }

    // ──── 4. MONTHLY UPLOAD ────
    console.log('\n── MONTHLY UPLOAD ──');
    
    // Upload Book1.xlsx
    const fs = require('fs');
    const path = require('path');
    const book1Path = path.join(__dirname, '..', 'Book1.xlsx');
    
    if (fs.existsSync(book1Path)) {
        // Use multipart/form-data manually
        const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
        const fileBuffer = fs.readFileSync(book1Path);
        const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="Book1.xlsx"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`;
        const footer = `\r\n--${boundary}--\r\n`;
        const body = Buffer.concat([Buffer.from(header), fileBuffer, Buffer.from(footer)]);
        
        const uploadRes = await fetch(`${BASE}/admin/upload/monthly`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
            },
            body: body,
        });
        const uploadData = await uploadRes.json();
        test('POST /admin/upload/monthly (Book1.xlsx)', uploadRes.status === 201 && uploadData.log, `status=${uploadRes.status}, success=${uploadData.log?.successCount}, failed=${uploadData.log?.failureCount}`);
    } else {
        test('POST /admin/upload/monthly (Book1.xlsx)', false, 'Book1.xlsx not found');
    }

    // ──── 5. REPORTS ────
    console.log('\n── REPORTS ──');
    
    // Monthly report
    r = await request('GET', '/admin/reports/monthly/2025-10', null, adminToken, true);
    test('GET /admin/reports/monthly/2025-10', r.status === 200 && r.size > 0, `status=${r.status}, size=${r.size}B`);

    // Yearly report
    r = await request('GET', '/admin/reports/yearly/2025', null, adminToken, true);
    test('GET /admin/reports/yearly/2025', r.status === 200 && r.size > 0, `status=${r.status}, size=${r.size}B`);

    // Individual employee monthly report
    if (testEmpMongoId) {
        r = await request('GET', `/admin/employees/${testEmpMongoId}/report/monthly/2025-10`, null, adminToken, true);
        test('GET /admin/employees/:id/report/monthly/:month', r.status === 200 && r.size > 0, `status=${r.status}, size=${r.size}B`);

        r = await request('GET', `/admin/employees/${testEmpMongoId}/report/yearly/2025`, null, adminToken, true);
        test('GET /admin/employees/:id/report/yearly/:year', r.status === 200 && r.size > 0, `status=${r.status}, size=${r.size}B`);
    }

    // ──── 6. ADJUSTMENTS ────
    console.log('\n── ADJUSTMENTS ──');
    
    if (testEmpMongoId) {
        // Adjust salary
        r = await request('POST', `/admin/employees/${testEmpMongoId}/adjust-salary`, {
            newSalary: 60000,
            reason: 'Test salary adjustment'
        }, adminToken);
        test('POST /admin/employees/:id/adjust-salary', r.status === 200, `status=${r.status}`);

        // Adjust thrift
        r = await request('POST', `/admin/employees/${testEmpMongoId}/adjust-thrift`, {
            newThriftContribution: 1500,
            reason: 'Test thrift adjustment'
        }, adminToken);
        test('POST /admin/employees/:id/adjust-thrift', r.status === 200, `status=${r.status}`);

        // Adjustment history
        r = await request('GET', `/admin/employees/${testEmpMongoId}/history`, null, adminToken);
        test('GET /admin/employees/:id/history', r.status === 200 && Array.isArray(r.data), `status=${r.status}, count=${r.data?.length}`);

        // Employee transactions
        r = await request('GET', `/admin/employees/${testEmpMongoId}/transactions`, null, adminToken);
        test('GET /admin/employees/:id/transactions', r.status === 200 && Array.isArray(r.data), `status=${r.status}, count=${r.data?.length}`);
    }

    // ──── 7. LOANS ────
    console.log('\n── LOANS ──');
    
    r = await request('GET', '/loans', null, adminToken);
    test('GET /loans', r.status === 200 && Array.isArray(r.data), `status=${r.status}, count=${r.data?.length}`);

    // Create loan
    if (testEmpMongoId) {
        r = await request('POST', '/loans', {
            borrowerId: testEmpMongoId,
            loanAmount: 50000,
            interestRate: 8,
            emi: 5000,
            sureties: [],
        }, adminToken);
        test('POST /loans (create)', r.status === 201 || r.status === 200, `status=${r.status}`);
        const loanId = r.data?._id;

        if (loanId) {
            // Close loan
            r = await request('PUT', `/loans/${loanId}/close`, null, adminToken);
            test('PUT /loans/:id/close', r.status === 200, `status=${r.status}`);
        }
    }

    // ──── 8. YEARLY THRIFT UPDATE ────
    console.log('\n── YEARLY THRIFT UPDATE ──');
    
    r = await request('POST', '/admin/yearly-thrift-update', {
        year: 2025,
        shareCapital: 500000,
        bankBalance: 300000,
        cashInHand: 50000,
    }, adminToken);
    test('POST /admin/yearly-thrift-update', r.status === 200 && r.data?.results, `status=${r.status}, employees=${r.data?.results?.length}`);

    // ──── 9. EMPLOYEE ROUTES ────
    console.log('\n── EMPLOYEE ROUTES ──');
    
    // Use the credentials from the employee created earlier by createEmployee
    let empLoginRes = { status: 0, data: null };
    if (tempCreds) {
        empLoginRes = await request('POST', '/auth/login', { username: tempCreds.username, password: tempCreds.password });
    }
    if (empLoginRes.status === 200 && empLoginRes.data?.token) {
        employeeToken = empLoginRes.data.token;
        
        r = await request('GET', '/employee/me', null, employeeToken);
        test('GET /employee/me', r.status === 200, `status=${r.status}`);

        r = await request('GET', '/employee/dashboard', null, employeeToken);
        test('GET /employee/dashboard', r.status === 200, `status=${r.status}`);

        r = await request('GET', '/employee/transactions', null, employeeToken);
        test('GET /employee/transactions', r.status === 200, `status=${r.status}`);

        r = await request('GET', '/employee/loan', null, employeeToken);
        test('GET /employee/loan', r.status === 200, `status=${r.status}`);

        r = await request('GET', '/employee/sureties', null, employeeToken);
        test('GET /employee/sureties', r.status === 200, `status=${r.status}`);
    } else {
        test('Employee login', false, `Could not login as employee. Login status=${empLoginRes.status}, tempCreds=${!!tempCreds}`);
    }

    // ──── 10. CLEANUP ────
    console.log('\n── CLEANUP ──');
    
    if (newEmpId) {
        r = await request('DELETE', `/admin/employees/${newEmpId}`, null, adminToken);
        test('DELETE /admin/employees/:id', r.status === 200, `status=${r.status}`);
    }

    // ──── SUMMARY ────
    console.log('\n========================================');
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${results.length} total`);
    console.log('========================================\n');
    
    if (failed > 0) {
        console.log('Failed tests:');
        results.filter(r => !r.passed).forEach(r => console.log(`  ❌ ${r.name}`));
    }
}

run().catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
});
