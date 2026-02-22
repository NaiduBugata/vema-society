const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://vema:vema@cluster0.wouqskm.mongodb.net/').then(async () => {
  const db = mongoose.connection.db;
  
  await db.collection('transactions').deleteMany({});
  await db.collection('adjustmenthistories').deleteMany({});
  await db.collection('monthlyuploadlogs').deleteMany({});
  await db.collection('loans').deleteMany({});
  
  // Reset employee loan references and thrift balances
  await db.collection('employees').updateMany({}, { 
    $set: { activeLoan: null, guaranteeingLoans: [], thriftBalance: 0 }
  });
  
  console.log('Cleaned: transactions, adjustmenthistories, monthlyuploadlogs, loans');
  console.log('Reset employee loan refs and thrift balances');
  
  const empCount = await db.collection('employees').countDocuments();
  console.log('Employees remaining:', empCount);
  
  mongoose.disconnect();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
