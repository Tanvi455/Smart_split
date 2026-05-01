const express = require('express');
const router = express.Router();
const Settlement = require('../models/Settlement');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const { authMiddleware } = require('../middleware/auth');

// GET /api/settlements
router.get('/', authMiddleware, async (req, res) => {
  try {
    const settlements = await Settlement.find({
      $or: [{ fromUser: req.user._id }, { toUser: req.user._id }]
    }).populate('fromUser toUser', 'name avatar').populate('group', 'name');
    res.json(settlements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settlements
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { toUserId, groupId, amount, note } = req.body;
    if (!toUserId || !groupId || !amount)
      return res.status(400).json({ error: 'toUserId, groupId, and amount are required' });

    const settlement = await Settlement.create({
      fromUser: req.user._id, toUser: toUserId,
      group: groupId, amount: parseFloat(amount), note: note || ''
    });
    const populated = await settlement.populate('fromUser toUser group', 'name avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/settlements/summary
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id }, '_id');
    const groupIds = groups.map(g => g._id);
    const expenses = await Expense.find({ group: { $in: groupIds } });

    let totalOwed = 0;
    let totalOwing = 0;

    expenses.forEach(exp => {
      if (String(exp.paidBy) === String(req.user._id)) {
        exp.participants.forEach(p => {
          if (String(p.user) !== String(req.user._id) && !p.settled) totalOwed += p.share;
        });
      } else {
        const myPart = exp.participants.find(p => String(p.user) === String(req.user._id));
        if (myPart && !myPart.settled) totalOwing += myPart.share;
      }
    });

    res.json({
      totalOwed: Math.round(totalOwed * 100) / 100,
      totalOwing: Math.round(totalOwing * 100) / 100,
      netBalance: Math.round((totalOwed - totalOwing) * 100) / 100
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
