// Run once to populate MongoDB with demo data:
//   node src/seed.js
const bcrypt = require('bcryptjs');
require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./models/User');
const Group    = require('./models/Group');
const Expense  = require('./models/Expense');

const MONGO_URI = "mongodb://kiranuser:Kiran123@ac-kmyoht0-shard-00-00.rrsr0gq.mongodb.net:27017,ac-kmyoht0-shard-00-01.rrsr0gq.mongodb.net:27017,ac-kmyoht0-shard-00-02.rrsr0gq.mongodb.net:27017/splitsmart?ssl=true&replicaSet=atlas-qgxt8l-shard-0&authSource=admin&retryWrites=true&w=majority";
async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([User.deleteMany(), Group.deleteMany(), Expense.deleteMany()]);
  console.log('Cleared existing data');

  // Create users (passwords hashed automatically by pre-save hook)
  const hashedPassword = await bcrypt.hash('password123', 10);

const [alice, bob, carol, dev] = await User.create([
  { name: 'Alice Kumar',  email: 'alice@demo.com', password: hashedPassword },
  { name: 'Bob Sharma',   email: 'bob@demo.com',   password: hashedPassword },
  { name: 'Carol Mehta',  email: 'carol@demo.com', password: hashedPassword },
  { name: 'Dev Patel',    email: 'dev@demo.com',   password: hashedPassword }
]);
  console.log('Created 4 demo users');

  // Create groups
  const [goaTrip, flatExpenses] = await Group.create([
    { name: 'Goa Trip 2025',   description: 'Beach vacation with friends', category: 'trip', createdBy: alice._id, members: [alice._id, bob._id, carol._id, dev._id] },
    { name: 'Flat Expenses',   description: 'Monthly shared flat costs',   category: 'home', createdBy: bob._id,   members: [bob._id, carol._id, dev._id] }
  ]);
  console.log('Created 2 demo groups');

  // Create expenses
  const hotelShare  = Math.round(12000 / 4 * 100) / 100;
  const flightShare = Math.round(24000 / 4 * 100) / 100;
  const elecShare   = Math.round(1800  / 3 * 100) / 100;

  await Expense.create([
    {
      group: goaTrip._id, description: 'Hotel booking — Goa Beach Resort',
      amount: 12000, category: 'accommodation', paidBy: alice._id, splitType: 'equal',
      participants: [alice, bob, carol, dev].map(u => ({ user: u._id, share: hotelShare }))
    },
    {
      group: goaTrip._id, description: 'Flight tickets',
      amount: 24000, category: 'transport', paidBy: bob._id, splitType: 'equal',
      participants: [alice, bob, carol, dev].map(u => ({ user: u._id, share: flightShare }))
    },
    {
      group: flatExpenses._id, description: 'Electricity bill — March',
      amount: 1800, category: 'utilities', paidBy: carol._id, splitType: 'equal',
      participants: [bob, carol, dev].map(u => ({ user: u._id, share: elecShare }))
    }
  ]);
  console.log('Created 3 demo expenses');

  console.log('\n✅ Seed complete!');
  console.log('   Login: alice@demo.com / password123');
  console.log('   Also:  bob@demo.com, carol@demo.com, dev@demo.com');
  await mongoose.disconnect();
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
