import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { groupsAPI, expensesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CAT_EMOJI = { accommodation:'🏨', transport:'✈️', food:'🍔', utilities:'💡', entertainment:'🎬', shopping:'🛍️', other:'📦' };
const CAT_OPTIONS = ['accommodation','transport','food','utilities','entertainment','shopping','other'];

// ── Edit Group Modal ─────────────────────────────────────────────────────────
function EditGroupModal({ group, onClose, onSaved }) {
  const [name, setName]             = useState(group.name);
  const [description, setDescription] = useState(group.description || '');
  const [category, setCategory]     = useState(group.category || 'other');
  const [loading, setLoading]       = useState(false);
  const { addToast } = useToast();

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await groupsAPI.update(group._id, { name, description, category });
      addToast('Group updated successfully!', 'success');
      onSaved(res.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update group', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Edit Group</h2>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="label">Group Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <div className="form-group">
            <label className="label">Category</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="trip">✈️ Trip</option>
              <option value="home">🏠 Home</option>
              <option value="food">🍔 Food</option>
              <option value="event">🎉 Event</option>
              <option value="work">💼 Work</option>
              <option value="other">📦 Other</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Expense Modal ───────────────────────────────────────────────────────
function EditExpenseModal({ expense, onClose, onSaved }) {
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount]           = useState(expense.amount);
  const [category, setCategory]       = useState(expense.category || 'other');
  const [loading, setLoading]         = useState(false);
  const { addToast } = useToast();

  const handleSave = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    setLoading(true);
    try {
      const res = await expensesAPI.update(expense._id, { description, amount: parseFloat(amount), category });
      addToast('Expense updated!', 'success');
      onSaved(res.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update expense', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Edit Expense</h2>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="label">Description</label>
            <input className="input" value={description} onChange={e => setDescription(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label">Amount (₹)</label>
            <input className="input" type="number" min="0.01" step="0.01" value={amount}
              onChange={e => setAmount(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label">Category</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              {CAT_OPTIONS.map(c => (
                <option key={c} value={c}>{CAT_EMOJI[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main GroupDetail ─────────────────────────────────────────────────────────
export default function GroupDetail() {
  const { id }      = useParams();
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const { addToast } = useToast();

  const [group, setGroup]           = useState(null);
  const [balances, setBalances]     = useState({ balances:[], debts:[] });
  const [tab, setTab]               = useState('expenses');
  const [loading, setLoading]       = useState(true);
  const [deleting, setDeleting]     = useState(false);

  const [editGroupOpen, setEditGroupOpen]     = useState(false);
  const [editExpense, setEditExpense]         = useState(null); // expense object or null

  const loadGroup = useCallback(async () => {
    try {
      const [gRes, bRes] = await Promise.all([groupsAPI.get(id), groupsAPI.getBalances(id)]);
      setGroup(gRes.data);
      setBalances(bRes.data);
    } catch {
      navigate('/');
    }
  }, [id, navigate]);

  useEffect(() => { loadGroup().finally(() => setLoading(false)); }, [loadGroup]);

  // ── Delete Group ────────────────────────────────────────────────────────────
  const handleDeleteGroup = async () => {
    if (!window.confirm(`Delete "${group.name}"? This will also delete all expenses. This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await groupsAPI.delete(id);
      addToast('Group deleted successfully', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to delete group', 'error');
      setDeleting(false);
    }
  };

  // ── Delete Expense ──────────────────────────────────────────────────────────
  const handleDeleteExpense = async (expId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expensesAPI.delete(expId);
      addToast('Expense deleted', 'success');
      await loadGroup();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to delete expense', 'error');
    }
  };

  // ── After edit group saved ──────────────────────────────────────────────────
  const handleGroupSaved = (updated) => {
    setGroup(prev => ({ ...prev, name: updated.name, description: updated.description, category: updated.category }));
    setEditGroupOpen(false);
  };

  // ── After edit expense saved ────────────────────────────────────────────────
  const handleExpenseSaved = async () => {
    setEditExpense(null);
    await loadGroup();
  };

  const isCreator = group && String(group.createdBy?._id || group.createdBy) === String(user._id);

  if (loading || !group) return <div className="layout"><Navbar /><div className="loading-screen"><div className="spinner" /></div></div>;

  return (
    <div className="layout">
      <Navbar />
      <main className="main">
        <Link to="/" className="back-link">← Back to groups</Link>

        <div className="group-detail-header">
          <div className="group-detail-title">
            <h1>{group.name}</h1>
            <p>
              {group.description || 'No description'} &nbsp;·&nbsp;
              {group.members?.length} members &nbsp;·&nbsp;
              ₹{(group.totalExpenses || 0).toLocaleString()} total
            </p>
          </div>
          <div className="group-header-actions">
            <Link to={`/groups/${id}/add-expense`} className="btn btn-primary btn-sm">+ Add Expense</Link>
            {isCreator && (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditGroupOpen(true)}>✏️ Edit</button>
                <button className="btn btn-danger btn-sm" onClick={handleDeleteGroup} disabled={deleting}>
                  {deleting ? 'Deleting…' : '🗑 Delete Group'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="tabs">
          {['expenses','balances','members'].map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Expenses Tab ── */}
        {tab === 'expenses' && (
          <div className="expense-list">
            {!group.expenses?.length ? (
              <div className="empty">
                <div className="empty-icon">💸</div>
                <h3>No expenses yet</h3>
                <p>Add the first expense to get started</p>
              </div>
            ) : group.expenses.map(exp => {
              const isMine = String(exp.paidBy?._id || exp.paidBy) === String(user._id);
              return (
                <div key={exp._id} className="expense-item">
                  <div className="expense-cat">{CAT_EMOJI[exp.category] || '📦'}</div>
                  <div className="expense-info">
                    <div className="expense-desc">{exp.description}</div>
                    <div className="expense-sub">
                      Paid by {isMine ? 'you' : (exp.paidBy?.name || 'someone')} &nbsp;·&nbsp;
                      {new Date(exp.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    </div>
                  </div>
                  <div className="expense-amount">
                    <div className="amount">₹{exp.amount.toLocaleString()}</div>
                    <div className="split">{exp.splitType} split</div>
                  </div>
                  {isMine && (
                    <div className="expense-actions">
                      <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => setEditExpense(exp)}>✏️</button>
                      <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={() => handleDeleteExpense(exp._id)}>🗑</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Balances Tab ── */}
        {tab === 'balances' && (
          <div>
            <div className="balance-list">
              {balances.balances.map(b => (
                <div key={b.userId} className="balance-item">
                  <div className="balance-user">
                    <div className="avatar lg">{b.avatar}</div>
                    <div>
                      <div style={{ fontWeight:500 }}>{b.name}{String(b.userId) === String(user._id) ? ' (you)' : ''}</div>
                      <div style={{ fontSize:12, color:'var(--text-dim)' }}>{b.netBalance >= 0 ? 'is owed' : 'owes'}</div>
                    </div>
                  </div>
                  <div className={`balance-amount ${b.netBalance >= 0 ? 'pos' : 'neg'}`}>
                    {b.netBalance >= 0 ? '+' : ''}₹{Math.abs(b.netBalance).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            {balances.debts.length > 0 && (
              <>
                <h3 style={{ margin:'24px 0 12px', fontSize:16 }}>Suggested Settlements</h3>
                <div className="debt-list">
                  {balances.debts.map((d, i) => (
                    <div key={i} className="debt-item">
                      <div className="avatar" style={{ background:'var(--danger)', color:'#fff' }}>{d.fromName?.[0]}</div>
                      <span><strong>{d.fromName}</strong> pays <strong>{d.toName}</strong></span>
                      <span style={{ marginLeft:'auto', color:'var(--danger)', fontFamily:'Playfair Display', fontSize:16 }}>
                        ₹{d.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Members Tab ── */}
        {tab === 'members' && (
          <div className="members-list">
            {group.members?.map(m => (
              <div key={m._id} className="member-item">
                <div className="avatar lg">{m.avatar}</div>
                <div style={{ flex:1 }}>
                  <div className="member-name">
                    {m.name}
                    {String(m._id) === String(group.createdBy?._id || group.createdBy) && <span className="badge">Admin</span>}
                    {String(m._id) === String(user._id) && <span className="badge badge-green">You</span>}
                  </div>
                  <div className="member-email">{m.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {editGroupOpen && (
        <EditGroupModal group={group} onClose={() => setEditGroupOpen(false)} onSaved={handleGroupSaved} />
      )}
      {editExpense && (
        <EditExpenseModal expense={editExpense} onClose={() => setEditExpense(null)} onSaved={handleExpenseSaved} />
      )}
    </div>
  );
}
