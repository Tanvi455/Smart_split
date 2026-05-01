const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  share: { type: Number, required: true },
  settled: { type: Boolean, default: false }
}, { _id: false });

const expenseSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0.01 },
  currency: { type: String, default: 'INR' },
  category: {
    type: String,
    enum: ['accommodation', 'transport', 'food', 'utilities', 'entertainment', 'shopping', 'other'],
    default: 'other'
  },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  splitType: { type: String, enum: ['equal', 'custom'], default: 'equal' },
  participants: [participantSchema],
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
