/**
 * One-time script: reads vema.xlsx and seeds surety data into all loans
 * Run: node seed_sureties.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const Employee = require('./models/Employee');
const Loan = require('./models/Loan');

const EXCEL_PATH = 'C:\\Users\\Sarojini Naidu\\Downloads\\vema.xlsx';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('Connected to DB:', mongoose.connection.name);

    // Read Excel
    const wb = xlsx.readFile(EXCEL_PATH);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Find header row
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(rawData.length, 15); i++) {
        const cells = (rawData[i] || []).map(c => String(c || '').trim().toLowerCase());
        if (cells.some(c => c.includes('emp') || c.includes('name of'))) {
            headerRowIdx = i;
            break;
        }
    }

    const data = xlsx.utils.sheet_to_json(sheet, { range: headerRowIdx });

    // Collect ALL column keys across ALL rows (some rows may not have surety cols)
    const allKeysSet = new Set();
    for (const row of data) for (const k of Object.keys(row)) allKeysSet.add(k);
    const allKeys = Array.from(allKeysSet);
    console.log('All columns found:', allKeys.join(', '));

    // Find surety columns using exact name or regex
    const surityCols = {};
    for (let si = 1; si <= 6; si++) {
        const exact = allKeys.find(k => {
            const n = k.trim().replace(/\s+/g, ' ').toLowerCase();
            return n === `surity${si} emp .id` || n === `surity${si} emp id` || n === `surity${si}`;
        });
        if (exact) { surityCols[si] = exact; continue; }
        // Regex fallback
        const re = new RegExp(`sur[iey][^\\d]*${si}`, 'i');
        const found = allKeys.find(k => re.test(k));
        if (found) surityCols[si] = found;
    }
    console.log('Surety columns mapped:', JSON.stringify(surityCols));

    let updatedLoans = 0;
    let errors = 0;

    for (const row of data) {
        // Get empId from row
        const empIdRaw = row['Emp. ID'] ?? row['Emp.ID'] ?? row['EmpID'] ?? row['Emp ID'];
        if (!empIdRaw) continue;
        const empIdStr = String(empIdRaw).trim();

        // Collect surety empIds from this row
        const incomingSuretyEmpIds = [];
        for (let si = 1; si <= 6; si++) {
            const col = surityCols[si];
            if (!col) continue;
            const val = row[col];
            if (val === undefined || val === null || val === '' || val === 0) continue;
            // Convert float like 19.0 → "19"
            const str = String(val).trim();
            const cleaned = (!isNaN(Number(str)) && str !== '') ? String(Math.round(Number(str))) : str;
            if (cleaned && cleaned !== '0') incomingSuretyEmpIds.push(cleaned);
        }

        if (incomingSuretyEmpIds.length === 0) continue; // skip employees with no sureties

        try {
            // Find employee
            let emp = await Employee.findOne({ empId: empIdStr });
            if (!emp) emp = await Employee.findOne({ empId: Number(empIdStr) });
            if (!emp) { console.log(`  ⚠ Emp not found: ${empIdStr}`); errors++; continue; }

            // Find their active loan
            let loan = null;
            if (emp.activeLoan) loan = await Loan.findById(emp.activeLoan);
            if (!loan) loan = await Loan.findOne({ borrower: emp._id, status: 'active' });
            if (!loan) { console.log(`  ⚠ No active loan for emp ${empIdStr} (${emp.name})`); errors++; continue; }

            // Resolve surety empIds → ObjectIds
            const newSuretyObjectIds = [];
            for (const sId of incomingSuretyEmpIds) {
                let sEmp = await Employee.findOne({ empId: sId });
                if (!sEmp) sEmp = await Employee.findOne({ empId: Number(sId) });
                if (sEmp) {
                    newSuretyObjectIds.push(sEmp._id);
                    // Add loan to surety's guaranteeingLoans
                    await Employee.updateOne(
                        { _id: sEmp._id, guaranteeingLoans: { $ne: loan._id } },
                        { $addToSet: { guaranteeingLoans: loan._id } }
                    );
                }
            }

            loan.sureties = newSuretyObjectIds;
            loan.suretyEmpIds = incomingSuretyEmpIds;
            await loan.save();

            // Make sure emp has activeLoan linked
            if (!emp.activeLoan) {
                emp.activeLoan = loan._id;
                emp.loanStatus = 'Loan';
                await emp.save();
            }

            console.log(`  ✅ Emp ${empIdStr} (${emp.name}): sureties = [${incomingSuretyEmpIds.join(', ')}] | resolved ${newSuretyObjectIds.length}/${incomingSuretyEmpIds.length}`);
            updatedLoans++;
        } catch (err) {
            console.error(`  ❌ Error for emp ${empIdStr}:`, err.message);
            errors++;
        }
    }

    console.log(`\n=== DONE ===`);
    console.log(`Updated loans: ${updatedLoans}`);
    console.log(`Errors/skipped: ${errors}`);
    await mongoose.disconnect();
}).catch(err => { console.error('DB error:', err.message); process.exit(1); });
