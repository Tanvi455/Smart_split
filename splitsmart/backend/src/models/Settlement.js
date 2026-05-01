const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  note: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Settlement', settlementSchema);
