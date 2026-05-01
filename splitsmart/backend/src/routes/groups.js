const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const { authMiddleware } = require('../middleware/auth');

// GET /api/groups — all groups for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'name email avatar')
      .populate('createdBy', 'name');

    // Attach expense totals
    const result = await Promise.all(groups.map(async (g) => {
      const expenses = await Expense.find({ group: g._id });
      const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
      return { ...g.toObject(), totalExpenses, expenseCount: expenses.length };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groups — create group
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, category, memberIds = [] } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name is required' });

    // Deduplicate and include creator
    const allMembers = [...new Set([String(req.user._id), ...memberIds])];

    const group = await Group.create({
      name, description, category,
      createdBy: req.user._id,
      members: allMembers
    });

    const populated = await group.populate('members', 'name email avatar');
    res.status(201).json({ ...populated.toObject(), totalExpenses: 0, expenseCount: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/groups/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email avatar')
      .populate('createdBy', 'name');
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const isMember = group.members.some(m => String(m._id) === String(req.user._id));
    if (!isMember) return res.status(403).json({ error: 'Access denied' });

    const expenses = await Expense.find({ group: group._id })
      .populate('paidBy', 'name avatar')
      .populate('participants.user', 'name avatar')
      .sort({ date: -1 });

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    res.json({ ...group.toObject(), expenses, totalExpenses, expenseCount: expenses.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/groups/:id — edit group (creator only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (String(group.createdBy) !== String(req.user._id))
      return res.status(403).json({ error: 'Only the group creator can edit this group' });

    const { name, description, category } = req.body;
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (category) group.category = category;
    await group.save();

    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/groups/:id — creator only
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (String(group.createdBy) !== String(req.user._id))
      return res.status(403).json({ error: 'Only the group creator can delete this group' });

    await Expense.deleteMany({ group: group._id });
    await group.deleteOne();
    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groups/:id/members — add a member
router.post('/:id/members', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (group.members.map(String).includes(userId))
      return res.status(409).json({ error: 'User already in group' });

    group.members.push(userId);
    await group.save();
    res.status(201).json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/groups/:id/balances — net balances + suggested settlements
router.get('/:id/balances', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'name avatar');
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const expenses = await Expense.find({ group: group._id });

    // Calculate net balance per member
    const net = {};
    group.members.forEach(m => { net[String(m._id)] = 0; });

    expenses.forEach(exp => {
      const payerId = String(exp.paidBy);
      net[payerId] = (net[payerId] || 0) + exp.amount;
      exp.participants.forEach(p => {
        const uid = String(p.user);
        net[uid] = (net[uid] || 0) - p.share;
      });
    });

    // Greedy debt simplification
    const debts = [];
    const creditors = Object.entries(net).filter(([, v]) => v > 0).map(([id, amt]) => ({ id, amt }));
    const debtors = Object.entries(net).filter(([, v]) => v < 0).map(([id, amt]) => ({ id, amt: -amt }));

    let ci = 0, di = 0;
    while (ci < creditors.length && di < debtors.length) {
      const settle = Math.min(creditors[ci].amt, debtors[di].amt);
      if (settle > 0.01) {
        const fromUser = group.members.find(m => String(m._id) === debtors[di].id);
        const toUser = group.members.find(m => String(m._id) === creditors[ci].id);
        debts.push({ from: debtors[di].id, fromName: fromUser?.name, to: creditors[ci].id, toName: toUser?.name, amount: Math.round(settle * 100) / 100 });
      }
      creditors[ci].amt -= settle;
      debtors[di].amt -= settle;
      if (creditors[ci].amt < 0.01) ci++;
      if (debtors[di].amt < 0.01) di++;
    }

    const balances = group.members.map(m => ({
      userId: m._id,
      name: m.name,
      avatar: m.avatar,
      netBalance: Math.round((net[String(m._id)] || 0) * 100) / 100
    }));

    res.json({ balances, debts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
