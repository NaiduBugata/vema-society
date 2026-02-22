/**
 * Seed employees from Book1.xlsx into the database.
 * Reads the real Vignan Society Excel file and creates Employee documents.
 * Usage: node seed_book1.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const Employee = require('./models/Employee');

const BOOK1_PATH = path.join(__dirname, '..', 'Book1.xlsx');

async function seedFromBook1() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    const workbook = xlsx.readFile(BOOK1_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Find header row - look for actual column headers like 'S.No' or 'Emp. ID' as distinct cell values
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(rawData.length, 15); i++) {
        const cells = (rawData[i] || []).map(c => String(c || '').trim().replace(/\s+/g, ' ').toLowerCase());
        // A header row should have 'emp. id' or 'emp id' AND 'name' as separate cell values
        const hasEmpId = cells.some(c => c === 'emp. id' || c === 'emp id' || c === 'emp.id' || c === 'empid');
        const hasName = cells.some(c => c.includes('name of') || c === 'name' || c === 'employee name');
        if (hasEmpId && hasName) {
            headerRowIdx = i;
            break;
        }
    }
    if (headerRowIdx === -1) {
        console.error('Could not find header row in Book1.xlsx');
        process.exit(1);
    }

    const headers = rawData[headerRowIdx];
    console.log('Header row:', headerRowIdx, headers);

    // Find column indices
    const norm = (s) => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
    const findCol = (search) => headers.findIndex(h => norm(h).startsWith(search));

    const snoIdx = findCol('s.no');
    const empIdIdx = findCol('emp');
    const nameIdx = headers.findIndex(h => norm(h).includes('name'));
    const cbThriftIdx = headers.findIndex(h => norm(h).includes('cb thrift'));
    const loanIdx = headers.findIndex(h => norm(h) === 'loan');
    const monthlyThriftIdx = headers.findIndex(h => norm(h).includes('threft') || norm(h).includes('monthly thrift'));

    console.log(`Columns: S.No=${snoIdx}, EmpID=${empIdIdx}, Name=${nameIdx}, CBThrift=${cbThriftIdx}, Loan=${loanIdx}, MonthlyThrift=${monthlyThriftIdx}`);

    // Clear existing employees (optional - comment out to keep existing)
    const existingCount = await Employee.countDocuments();
    console.log(`Existing employees in DB: ${existingCount}`);

    let created = 0, updated = 0, skipped = 0;

    for (let i = headerRowIdx + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;

        // Skip totals row (S.No is empty/null)
        const sno = row[snoIdx];
        if (sno === null || sno === undefined || sno === '' || String(sno).toUpperCase() === 'TOTAL') {
            console.log(`Skipping row ${i + 1} (total/empty)`);
            continue;
        }

        const empId = row[empIdIdx] !== undefined && row[empIdIdx] !== '' ? String(row[empIdIdx]).trim() : null;
        const name = row[nameIdx] ? String(row[nameIdx]).trim() : null;

        if (!name) {
            console.log(`Skipping row ${i + 1} - no name`);
            skipped++;
            continue;
        }

        const cbThrift = cbThriftIdx >= 0 && row[cbThriftIdx] ? Number(row[cbThriftIdx]) || 0 : 0;
        const monthlyThrift = monthlyThriftIdx >= 0 && row[monthlyThriftIdx] ? Number(row[monthlyThriftIdx]) || 0 : 0;
        const loanBalance = loanIdx >= 0 && row[loanIdx] ? Number(row[loanIdx]) || 0 : 0;

        // Try to find existing employee by empId or name
        let employee = null;
        if (empId) {
            employee = await Employee.findOne({ empId });
            // Also try numeric match
            if (!employee && !isNaN(Number(empId))) {
                employee = await Employee.findOne({ empId: Number(empId) });
            }
        }
        if (!employee && name) {
            employee = await Employee.findOne({
                name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
            });
        }

        if (employee) {
            // Update existing employee
            if (empId) employee.empId = empId;
            employee.thriftBalance = cbThrift;
            employee.thriftContribution = monthlyThrift;
            await employee.save();
            updated++;
        } else {
            // Create new employee
            const email = `emp${empId || sno}@vignan.ac.in`.replace(/\s+/g, '');
            try {
                await Employee.create({
                    empId: empId,
                    name: name,
                    email: email,
                    department: 'General',
                    designation: 'Employee',
                    salary: 0,
                    thriftContribution: monthlyThrift,
                    thriftBalance: cbThrift,
                });
                created++;
            } catch (err) {
                if (err.code === 11000) {
                    // Duplicate key - try updating instead
                    console.log(`Duplicate for ${name} (${empId}), updating...`);
                    await Employee.updateOne(
                        { $or: [{ empId }, { email }] },
                        { $set: { name, thriftBalance: cbThrift, thriftContribution: monthlyThrift } }
                    );
                    updated++;
                } else {
                    console.error(`Error creating ${name}:`, err.message);
                    skipped++;
                }
            }
        }
    }

    console.log(`\n=== Seeding Complete ===`);
    console.log(`Created: ${created}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total employees in DB: ${await Employee.countDocuments()}`);

    await mongoose.disconnect();
}

seedFromBook1().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
