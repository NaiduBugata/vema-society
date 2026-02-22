const xlsx = require('xlsx');
const path = require('path');

// Read Book1.xlsx and check its structure
const filePath = path.join(__dirname, '../Book1.xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Test 1:  Get raw data
console.log('=== Test 1: Raw Data (first 10 rows) ===');
const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
for (let i = 0; i < Math.min(rawData.length, 10); i++) {
    console.log(`Row ${i}:`, rawData[i]);
}

// Test 2: Detect header row
console.log('\n=== Test 2: Header Detection ===');
let headerRowIdx = 0;
for (let i = 0; i < Math.min(rawData.length, 15); i++) {
    const cells = (rawData[i] || []).map(c => String(c || '').trim().replace(/\s+/g, ' ').toLowerCase());
    const hasEmpId = cells.some(c => c.includes('emp') && (c.includes('id') || c.includes('.id')));
    const hasName = cells.some(c => c.includes('name'));
    console.log(`Row ${i} - hasEmpId:${hasEmpId}, hasName:${hasName}, cells:`, cells.slice(0, 5));
    if (hasEmpId && hasName) {
        headerRowIdx = i;
        console.log(`✓ Header row detected at index ${i}`);
        break;
    }
}

// Test 3: Parse with detected header
console.log(`\n=== Test 3: Parse from row ${headerRowIdx} ===`);
const data = xlsx.utils.sheet_to_json(sheet, { range: headerRowIdx });
console.log('Total data rows:', data.length);
console.log('First data row keys:', Object.keys(data[0] || {}));
console.log('First data row:', data[0]);
console.log('Second data row:', data[1]);

// Test 4: Column detection
console.log('\n=== Test 4: Column Detection ===');
const firstRowKeys = Object.keys(data[0] || {});
const normalize = (s) => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();

const findCol = (aliases) => {
    for (const alias of aliases) {
        const normAlias = normalize(alias);
        const found = firstRowKeys.find(k => normalize(k).includes(normAlias) || normalize(k).startsWith(normAlias));
        if (found) return found;
    }
    return null;
};

const empIdCol = findCol(['emp. id', 'emp id', 'empid', 'employee id']);
const nameCol = findCol(['name of the employ', 'name', 'employee name']);
const emailCol = findCol(['email', 'e-mail']);

console.log('Detected Emp ID column:', empIdCol);
console.log('Detected Name column:', nameCol);
console.log('Detected Email column:', emailCol);

if (nameCol) {
    console.log('\nFirst row name value:', data[0][nameCol]);
    console.log('Second row name value:', data[1][nameCol]);
}
