const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

async function testBook1Upload() {
    try {
        // 1. Login as admin
        console.log('1. Logging in as admin...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('✓ Login successful');

        // 2. Upload Book1.xlsx
        console.log('\n2. Uploading Book1.xlsx...');
        const filePath = path.join(__dirname, '../Book1.xlsx');
        
        if (!fs.existsSync(filePath)) {
            console.error('✗ Book1.xlsx not found at:', filePath);
            return;
        }

        const formData = new FormData();
        const fileBuffer = fs.readFileSync(filePath);
        const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        formData.append('file', blob, 'Book1.xlsx');

        const uploadRes = await fetch(`${API_URL}/admin/upload/employees`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const uploadData = await uploadRes.json();
        
        if (!uploadRes.ok) {
            console.error('✗ Upload failed:', uploadData.message || uploadData);
            if (uploadData.log?.errorLog) {
                console.error('\nError Log:');
                uploadData.log.errorLog.forEach(err => {
                    console.error(`  Row ${err.row}: ${err.error}`);
                });
            }
            if (uploadData.error) {
                console.error('\nDetailed Error:', uploadData.error);
            }
            return;
        }
        
        console.log('✓ Upload successful!');
        console.log('\nUpload Results:');
        console.log('- Success Count:', uploadData.log.successCount);
        console.log('- Failure Count:', uploadData.log.failureCount);
        console.log('- Skipped Existing:', uploadData.skippedExisting?.length || 0);
        console.log('- Created Users (login accounts):', uploadData.createdUsers?.length || 0);

        if (uploadData.log.errorLog && uploadData.log.errorLog.length > 0) {
            console.log('\nErrors (first 10):');
            uploadData.log.errorLog.slice(0, 10).forEach(err => {
                console.log(`  Row ${err.row}: ${err.error}`);
            });
        }

        if (uploadData.skippedExisting && uploadData.skippedExisting.length > 0) {
            console.log('\nSkipped Existing (first 5):');
            uploadData.skippedExisting.slice(0, 5).forEach(skip => {
                console.log(`  Row ${skip.row}: ${skip.name} (${skip.empId}) - ${skip.reason}`);
            });
        }

        if (uploadData.createdUsers && uploadData.createdUsers.length > 0) {
            console.log('\nSample Created Users (first 3):');
            uploadData.createdUsers.slice(0, 3).forEach(user => {
                console.log(`  ${user.name} - Username: ${user.username} / Password: ${user.password}`);
            });
        }

        // 3. Verify employees in DB
        console.log('\n3. Verifying employees in database...');
        const empRes = await fetch(`${API_URL}/admin/employees`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const employees = await empRes.json();
        console.log('✓ Total employees in DB:', employees.length);
        
        if (employees.length > 0) {
            console.log('\nSample Employees (first 3):');
            employees.slice(0, 3).forEach(emp => {
                console.log(`  ${emp.name} (Emp.ID: ${emp.empId || 'N/A'}, Email: ${emp.email || 'Not set'})`);
            });
        }

        // 4. Test re-upload (should skip all)
        console.log('\n4. Testing re-upload (should skip all existing)...');
        
        // Re-create formData
        const formData2 = new FormData();
        const fileBuffer2 = fs.readFileSync(filePath);
        const blob2 = new Blob([fileBuffer2], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        formData2.append('file', blob2, 'Book1.xlsx');
        
        const reuploadRes = await fetch(`${API_URL}/admin/upload/employees`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData2
        });
        const reuploadData = await reuploadRes.json();
        
        console.log('✓ Re-upload test completed');
        console.log('- Success Count:', reuploadData.log.successCount);
        console.log('- Skipped Existing:', reuploadData.skippedExisting?.length || 0);

    } catch (error) {
        console.error('\n✗ Test failed:');
        console.error(error.message);
        if (error.cause) {
            console.error('Cause:', error.cause);
        }
    }
}

testBook1Upload();
