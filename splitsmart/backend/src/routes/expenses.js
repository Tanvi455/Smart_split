const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const { authMiddleware } = require('../middleware/auth');

// GET /api/expenses — all expenses for current user's groups
router.get('/', authMiddleware, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id }, '_id');
    const groupIds = groups.map(g => g._id);
    const expenses = await Expense.find({ group: { $in: groupIds } })
      .populate('paidBy', 'name avatar')
      .populate('group', 'name')
      .populate('participants.user', 'name avatar')
      .sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/expenses — create expense
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { groupId, description, amount, category, splitType, date } = req.body;
    if (!groupId || !description || !amount)
      return res.status(400).json({ error: 'groupId, description, and amount are required' });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const isMember = group.members.map(String).includes(String(req.user._id));
    if (!isMember) return res.status(403).json({ error: 'Not a member of this group' });

    const parsedAmount = parseFloat(amount);
    const share = Math.round((parsedAmount / group.members.length) * 100) / 100;
    const participants = group.members.map(uid => ({ user: uid, share, settled: false }));

    const expense = await Expense.create({
      group: groupId, description, amount: parsedAmount,
      category: category || 'other',
      paidBy: req.user._id,
      splitType: splitType || 'equal',
      participants,
      date: date || new Date()
    });

    const populated = await expense.populate([
      { path: 'paidBy', select: 'name avatar' },
      { path: 'participants.user', select: 'name avatar' },
      { path: 'group', select: 'name' }
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/expenses/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('paidBy', 'name avatar')
      .populate('participants.user', 'name avatar')
      .populate('group', 'name');
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/expenses/:id — edit expense (paidBy only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    if (String(expense.paidBy) !== String(req.user._id))
      return res.status(403).json({ error: 'Only the expense creator can edit this expense' });

    const { description, amount, category, date } = req.body;
    if (description) expense.description = description;
    if (amount) expense.amount = parseFloat(amount);
    if (category) expense.category = category;
    if (date) expense.date = date;
    await expense.save();

    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/expenses/:id — paidBy only
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    if (String(expense.paidBy) !== String(req.user._id))
      return res.status(403).json({ error: 'Only the expense creator can delete this expense' });

    await expense.deleteOne();
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/expenses/:id/settle
router.post('/:id/settle', authMiddleware, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    const targetId = req.body.userId || String(req.user._id);
    const participant = expense.participants.find(p => String(p.user) === targetId);
    if (!participant) return res.status(404).json({ error: 'Participant not found' });

    participant.settled = true;
    await expense.save();
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
