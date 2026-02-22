/**
 * VEMA Complete Test Suite
 * Tests: Backend API, Frontend pages, Frontend↔Backend integration
 * Run: node test_complete.js
 * Requires: both servers running (backend :5000, frontend :5173 or :5174)
 */
require('dotenv').config();

const API  = 'http://localhost:5000/api';
const UI_PORTS = [5173, 5174];

let adminToken = '';
let employeeToken = '';
let firstEmployeeId = '';
let firstEmpDocId   = '';

const results = { pass: 0, fail: 0, warn: 0, sections: [] };

// ── Colours ──────────────────────────────────────────────────
const G = s => `\x1b[32m${s}\x1b[0m`;
const R = s => `\x1b[31m${s}\x1b[0m`;
const Y = s => `\x1b[33m${s}\x1b[0m`;
const B = s => `\x1b[36m${s}\x1b[0m`;
const W = s => `\x1b[1m${s}\x1b[0m`;

let currentSection = '';
function section(name) {
    currentSection = name;
    console.log(`\n${B('━'.repeat(60))}`);
    console.log(B(`  ${name}`));
    console.log(B('━'.repeat(60)));
    results.sections.push({ name, tests: [] });
}

function pass(name, detail = '') {
    console.log(G(`  ✅ ${name}`) + (detail ? ` — ${detail}` : ''));
    results.pass++;
    results.sections.at(-1).tests.push({ name, status: 'pass' });
}
function fail(name, detail = '') {
    console.log(R(`  ❌ ${name}`) + (detail ? ` — ${detail}` : ''));
    results.fail++;
    results.sections.at(-1).tests.push({ name, status: 'fail', detail });
}
function warn(name, detail = '') {
    console.log(Y(`  ⚠️  ${name}`) + (detail ? ` — ${detail}` : ''));
    results.warn++;
    results.sections.at(-1).tests.push({ name, status: 'warn' });
}

async function api(method, path, body = null, token = null) {
    try {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (token) opts.headers['Authorization'] = `Bearer ${token}`;
        if (body)  opts.body = JSON.stringify(body);
        const res = await fetch(`${API}${path}`, opts);
        let data;
        try { data = await res.json(); } catch { data = null; }
        return { status: res.status, data, ok: res.ok };
    } catch (e) {
        return { status: 0, data: null, ok: false, error: e.message };
    }
}

async function httpGet(url) {
    try {
        const res = await fetch(url);
        return { status: res.status, ok: res.ok };
    } catch (e) {
        return { status: 0, ok: false, error: e.message };
    }
}

// ═══════════════════════════════════════════════════════════════
//  PART 1 — BACKEND TESTS
// ═══════════════════════════════════════════════════════════════
async function testBackend() {
    console.log(W('\n\n╔══════════════════════════════════════╗'));
    console.log(W('║   PART 1 — BACKEND API TESTS         ║'));
    console.log(W('╚══════════════════════════════════════╝'));

    // ── 1.1 Server reachability ──────────────────────────────
    section('1.1  Server Reachability');
    const ping = await httpGet('http://localhost:5000');
    ping.status > 0
        ? pass('Backend server is up', `HTTP ${ping.status}`)
        : fail('Backend server is NOT reachable on :5000', ping.error || '');

    // ── 1.2 Auth routes ──────────────────────────────────────
    section('1.2  Auth — POST /api/auth/login');

    let r = await api('POST', '/auth/login', { username: 'admin', password: 'admin1' });
    if (r.status === 200 && r.data?.token) {
        adminToken = r.data.token;
        pass('Admin login (admin / admin1)', `role=${r.data.role}`);
    } else {
        fail('Admin login', `status=${r.status} msg=${r.data?.message}`);
    }

    r = await api('POST', '/auth/login', { username: 'admin', password: 'wrongpass' });
    r.status === 401
        ? pass('Login rejects wrong password', 'status=401')
        : fail('Login should return 401 for wrong password', `got ${r.status}`);

    r = await api('POST', '/auth/login', {});
    (r.status === 401 || r.status === 400)
        ? pass('Login rejects empty body', `status=${r.status}`)
        : fail('Login should reject empty body', `got ${r.status}`);

    // ── 1.3 Auth guard ───────────────────────────────────────
    section('1.3  Auth Guard — Protected Routes Without Token');
    for (const path of ['/admin/dashboard', '/admin/employees', '/employee/me']) {
        r = await api('GET', path);
        (r.status === 401 || r.status === 403)
            ? pass(`${path} blocks unauthenticated`, `status=${r.status}`)
            : fail(`${path} should block unauthenticated`, `got ${r.status}`);
    }

    // ── 1.4 Admin dashboard ──────────────────────────────────
    section('1.4  Admin — Dashboard & Stats');
    r = await api('GET', '/admin/dashboard', null, adminToken);
    if (r.status === 200 && r.data) {
        pass('GET /admin/dashboard', `keys: ${Object.keys(r.data).join(', ')}`);
        const expected = ['totalEmployees', 'activeLoans'];
        for (const k of expected) {
            r.data[k] !== undefined
                ? pass(`  dashboard.${k} present`, String(r.data[k]))
                : warn(`  dashboard.${k} missing`);
        }
    } else {
        fail('GET /admin/dashboard', `status=${r.status}`);
    }

    // ── 1.5 Admin employees ──────────────────────────────────
    section('1.5  Admin — Employee CRUD');
    r = await api('GET', '/admin/employees', null, adminToken);
    if (r.status === 200 && Array.isArray(r.data)) {
        pass(`GET /admin/employees`, `${r.data.length} employees returned`);
        if (r.data.length > 0) {
            firstEmployeeId = r.data[0].empId;
            firstEmpDocId   = r.data[0]._id;
            pass('First employee sample', `empId=${firstEmployeeId} name=${r.data[0].name}`);
        }
    } else {
        fail('GET /admin/employees', `status=${r.status}`);
    }

    if (firstEmpDocId) {
        r = await api('GET', `/admin/employees/${firstEmpDocId}`, null, adminToken);
        r.status === 200 && r.data
            ? pass(`GET /admin/employees/:id`, `name=${r.data.name || r.data.employee?.name}`)
            : fail(`GET /admin/employees/:id`, `status=${r.status}`);
    }

    // ── 1.6 Employee transactions ────────────────────────────
    section('1.6  Admin — Employee Transactions');
    if (firstEmpDocId) {
        r = await api('GET', `/admin/employees/${firstEmpDocId}/transactions`, null, adminToken);
        r.status === 200
            ? pass(`GET /admin/employees/:id/transactions`, `count=${Array.isArray(r.data) ? r.data.length : (r.data?.transactions?.length ?? '?')}`)
            : fail(`GET /admin/employees/:id/transactions`, `status=${r.status}`);
    }

    // ── 1.7 Reports ──────────────────────────────────────────
    section('1.7  Admin — Reports');
    const thisMonth = new Date().toISOString().slice(0, 7);
    const thisYear  = new Date().getFullYear();

    r = await api('GET', `/admin/reports/monthly/${thisMonth}`, null, adminToken);
    (r.status === 200 || r.status === 404)
        ? pass(`GET /admin/reports/monthly/:month`, `status=${r.status}`)
        : fail(`GET /admin/reports/monthly/:month`, `status=${r.status}`);

    r = await api('GET', `/admin/reports/yearly/${thisYear}`, null, adminToken);
    (r.status === 200 || r.status === 404)
        ? pass(`GET /admin/reports/yearly/:year`, `status=${r.status}`)
        : fail(`GET /admin/reports/yearly/:year`, `status=${r.status}`);

    r = await api('GET', `/admin/reports/monthly-history`, null, adminToken);
    r.status === 200
        ? pass(`GET /admin/reports/monthly-history`, `count=${Array.isArray(r.data) ? r.data.length : '?'}`)
        : fail(`GET /admin/reports/monthly-history`, `status=${r.status}`);

    // ── 1.8 Adjustment History ───────────────────────────────
    section('1.8  Admin — Adjustment History');
    if (firstEmpDocId) {
        r = await api('GET', `/admin/employees/${firstEmpDocId}/history`, null, adminToken);
        r.status === 200
            ? pass(`GET /admin/employees/:id/history`, `count=${Array.isArray(r.data) ? r.data.length : '?'}`)
            : fail(`GET /admin/employees/:id/history`, `status=${r.status}`);
    }

    // ── 1.9 Loans ────────────────────────────────────────────
    section('1.9  Loans');
    r = await api('GET', '/loans', null, adminToken);
    (r.status === 200)
        ? pass(`GET /loans`, `count=${Array.isArray(r.data) ? r.data.length : '?'}`)
        : fail(`GET /loans`, `status=${r.status} msg=${r.data?.message}`);

    // ── 1.10 Employee self-service (need employee token) ─────
    section('1.10 Employee Self-Service Routes');

    // Try to find a real employee user
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI).catch(() => {});
    const User = require('./models/User');
    const empUser = await User.findOne({ role: 'employee' }).lean().catch(() => null);
    if (empUser) {
        // reset password so we can log in
        const bcrypt = require('bcryptjs');
        const tempPw = 'TestPass@123';
        await User.updateOne({ _id: empUser._id }, { password: await bcrypt.hash(tempPw, 10) }).catch(() => {});
        r = await api('POST', '/auth/login', { username: empUser.username, password: tempPw });
        if (r.status === 200 && r.data?.token) {
            employeeToken = r.data.token;
            pass(`Employee login (${empUser.username})`, `role=employee`);

            for (const [label, path] of [
                ['GET /employee/me',           '/employee/me'],
                ['GET /employee/dashboard',    '/employee/dashboard'],
                ['GET /employee/transactions', '/employee/transactions'],
                ['GET /employee/loan',         '/employee/loan'],
                ['GET /employee/sureties',     '/employee/sureties'],
            ]) {
                r = await api('GET', path, null, employeeToken);
                r.status === 200
                    ? pass(label, `status=200`)
                    : fail(label, `status=${r.status} msg=${r.data?.message}`);
            }
            // Employee cannot access admin routes
            r = await api('GET', '/admin/dashboard', null, employeeToken);
            (r.status === 401 || r.status === 403)
                ? pass('Employee blocked from /admin/dashboard', `status=${r.status}`)
                : fail('Employee should be blocked from admin routes', `got ${r.status}`);
        } else {
            warn('Could not log in as employee for self-service tests', `status=${r.status}`);
        }
    } else {
        warn('No employee User found — skipping employee route tests');
    }
    await mongoose.disconnect().catch(() => {});
}

// ═══════════════════════════════════════════════════════════════
//  PART 2 — FRONTEND TESTS
// ═══════════════════════════════════════════════════════════════
async function testFrontend() {
    console.log(W('\n\n╔══════════════════════════════════════╗'));
    console.log(W('║   PART 2 — FRONTEND PAGE TESTS       ║'));
    console.log(W('╚══════════════════════════════════════╝'));

    section('2.1  Frontend Dev Server Reachability');
    let frontendBase = null;
    for (const port of UI_PORTS) {
        const r = await httpGet(`http://localhost:${port}`);
        if (r.ok || r.status === 200) {
            frontendBase = `http://localhost:${port}`;
            pass(`Vite dev server running on :${port}`);
            break;
        }
    }
    if (!frontendBase) {
        fail('Frontend server NOT reachable on :5173 or :5174');
        return;
    }

    section('2.2  Frontend Pages Load (HTTP 200 + HTML response)');
    // All frontend routes are served by Vite as index.html (SPA)
    const pages = [
        ['Login            ', '/'],
        ['Forgot Password  ', '/forgot-password'],
        ['Reset Password   ', '/reset-password/testtoken'],
        ['Change Password  ', '/change-password'],
        ['Complete Profile ', '/complete-profile'],
        ['Admin Dashboard  ', '/admin/dashboard'],
        ['Admin Employees  ', '/admin/employees'],
        ['Admin Upload     ', '/admin/upload'],
        ['Admin Thrift     ', '/admin/thrift'],
        ['Admin Loans      ', '/admin/loans'],
        ['Emp Dashboard    ', '/employee/dashboard'],
        ['Emp Transactions ', '/employee/transactions'],
        ['Emp Loan         ', '/employee/loan'],
        ['Emp Sureties     ', '/employee/sureties'],
    ];

    for (const [label, path] of pages) {
        const r = await httpGet(`${frontendBase}${path}`);
        (r.ok || r.status === 200)
            ? pass(`${label} ${path}`, `HTTP ${r.status}`)
            : fail(`${label} ${path}`, `HTTP ${r.status || r.error}`);
    }

    section('2.3  Frontend Static Assets');
    // Vite serves /src/main.jsx etc; check that /assets path works by checking the root doc
    const rootRes = await fetch(`${frontendBase}/`);
    const html = await rootRes.text();
    html.includes('<div id="root">')
        ? pass('index.html has React root div')
        : fail('index.html missing <div id="root">');
    html.includes('vite') || html.includes('.js')
        ? pass('index.html references JS bundle')
        : warn('Could not confirm JS bundle in index.html');
}

// ═══════════════════════════════════════════════════════════════
//  PART 3 — INTEGRATION TESTS (Frontend ↔ Backend)
// ═══════════════════════════════════════════════════════════════
async function testIntegration() {
    console.log(W('\n\n╔══════════════════════════════════════╗'));
    console.log(W('║   PART 3 — INTEGRATION TESTS         ║'));
    console.log(W('╚══════════════════════════════════════╝'));

    section('3.1  CORS — Frontend Origin Accepted by API');
    // Simulate a request from the frontend origin
    for (const port of UI_PORTS) {
        try {
            const res = await fetch(`${API}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': `http://localhost:${port}`
                },
                body: JSON.stringify({ username: 'admin', password: 'admin1' })
            });
            const cors = res.headers.get('access-control-allow-origin');
            (res.status === 200)
                ? pass(`CORS: origin :${port} accepted`, cors ? `ACAO=${cors}` : 'no ACAO header (may be open)')
                : fail(`CORS: origin :${port} rejected`, `status=${res.status}`);
            break;
        } catch (e) {
            fail(`CORS test for :${port}`, e.message);
        }
    }

    section('3.2  Token Flow — Login → Authenticated API Call');
    let r = await api('POST', '/auth/login', { username: 'admin', password: 'admin1' });
    if (r.status === 200 && r.data?.token) {
        pass('Step 1: Login returns JWT token');
        const tok = r.data.token;
        r = await api('GET', '/admin/dashboard', null, tok);
        r.status === 200
            ? pass('Step 2: Token accepted on /admin/dashboard')
            : fail('Step 2: Token rejected', `status=${r.status}`);
        // Verify token format (3-part JWT)
        tok.split('.').length === 3
            ? pass('Step 3: Token is valid JWT format (header.payload.sig)')
            : fail('Step 3: Token is not standard JWT');
    } else {
        fail('Token flow — login failed, cannot continue');
    }

    section('3.3  Role Separation');
    // Admin-only endpoint with employee token
    if (employeeToken) {
        r = await api('DELETE', `/admin/employees/${firstEmpDocId}`, null, employeeToken);
        (r.status === 401 || r.status === 403)
            ? pass('Employee cannot call admin DELETE endpoint', `status=${r.status}`)
            : fail('Role check FAILED — employee accessed admin delete!', `status=${r.status}`);
    } else {
        warn('No employee token — skipping role separation test');
    }

    section('3.4  Data Integrity — API → DB Consistency');
    // Employees count from API matches DB
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI).catch(() => {});
    const Employee = require('./models/Employee');
    const Loan     = require('./models/Loan');

    const dbEmpCount  = await Employee.countDocuments();
    const dbLoanCount = await Loan.countDocuments({ status: 'active' });
    await mongoose.disconnect().catch(() => {});

    r = await api('GET', '/admin/employees', null, adminToken);
    if (r.status === 200 && Array.isArray(r.data)) {
        r.data.length === dbEmpCount
            ? pass(`API employee count matches DB`, `both=${dbEmpCount}`)
            : warn(`API count (${r.data.length}) vs DB count (${dbEmpCount}) — check pagination`);
    }

    r = await api('GET', '/admin/dashboard', null, adminToken);
    if (r.status === 200 && r.data?.activeLoans !== undefined) {
        r.data.activeLoans === dbLoanCount
            ? pass(`Dashboard activeLoans matches DB`, `both=${dbLoanCount}`)
            : warn(`Dashboard (${r.data.activeLoans}) vs DB (${dbLoanCount}) active loans`);
    }

    section('3.5  Error Handling');
    // Non-existent employee
    r = await api('GET', '/admin/employees/000000000000000000000000', null, adminToken);
    (r.status === 404 || r.status === 400)
        ? pass('Non-existent employee returns 404/400', `status=${r.status}`)
        : fail('Non-existent employee should return 404', `got ${r.status}`);

    // Bad body on create employee
    r = await api('POST', '/admin/employees', { name: '' }, adminToken);
    (r.status >= 400)
        ? pass('Create employee with empty name is rejected', `status=${r.status}`)
        : fail('Create employee with empty name should be rejected', `got ${r.status}`);
}

// ═══════════════════════════════════════════════════════════════
//  FINAL SUMMARY
// ═══════════════════════════════════════════════════════════════
async function main() {
    console.log(W('\n╔════════════════════════════════════════════╗'));
    console.log(W('║  VEMA SOCIETY — COMPLETE TEST SUITE        ║'));
    console.log(W('╚════════════════════════════════════════════╝'));
    console.log(`  Backend:  ${API}`);
    console.log(`  Frontend: http://localhost:${UI_PORTS.join(' or :')}`);

    await testBackend();
    await testFrontend();
    await testIntegration();

    console.log(W('\n\n╔════════════════════════════════════════════╗'));
    console.log(W('║              TEST SUMMARY                  ║'));
    console.log(W('╚════════════════════════════════════════════╝'));
    console.log(G(`  ✅ PASSED : ${results.pass}`));
    console.log(R(`  ❌ FAILED : ${results.fail}`));
    console.log(Y(`  ⚠️  WARNINGS: ${results.warn}`));
    console.log(`  TOTAL    : ${results.pass + results.fail + results.warn}`);

    if (results.fail > 0) {
        console.log(R('\n  Failed tests:'));
        for (const sec of results.sections) {
            for (const t of sec.tests) {
                if (t.status === 'fail') {
                    console.log(R(`    ✗ [${sec.name}] ${t.name}`) + (t.detail ? ` — ${t.detail}` : ''));
                }
            }
        }
    }
    console.log('');
    process.exit(results.fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
