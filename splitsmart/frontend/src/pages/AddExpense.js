import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { groupsAPI, expensesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function AddExpense() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { addToast } = useToast();
  const [group, setGroup]         = useState(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount]       = useState('');
  const [category, setCategory]   = useState('other');
  const [date, setDate]           = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    groupsAPI.get(id).then(res => setGroup(res.data)).catch(() => navigate('/'));
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount) { addToast('Description and amount are required', 'error'); return; }
    setLoading(true);
    try {
      await expensesAPI.create({ groupId: id, description, amount: parseFloat(amount), category, splitType:'equal', date });
      addToast('Expense added successfully! 💸', 'success');
      navigate(`/groups/${id}`);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to add expense', 'error');
      setLoading(false);
    }
  };

  if (!group) return <div className="layout"><Navbar /><div className="loading-screen"><div className="spinner" /></div></div>;

  const perPerson = amount && group.members?.length
    ? (parseFloat(amount) / group.members.length).toFixed(2)
    : null;

  return (
    <div className="layout">
      <Navbar />
      <main className="main">
        <Link to={`/groups/${id}`} className="back-link">← Back to {group.name}</Link>
        <div className="form-page">
          <h1>Add Expense</h1>
          <p>Recording expense for <strong>{group.name}</strong></p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Description *</label>
              <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this expense for?" required />
            </div>
            <div className="form-group">
              <label className="label">Amount (₹) *</label>
              <input className="input" type="number" min="0.01" step="0.01" value={amount}
                onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
              {perPerson && (
                <div className="hint">₹{perPerson} per person ({group.members.length} members)</div>
              )}
            </div>
            <div className="form-group">
              <label className="label">Category</label>
              <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="accommodation">🏨 Accommodation</option>
                <option value="transport">✈️ Transport</option>
                <option value="food">🍔 Food & Drinks</option>
                <option value="utilities">💡 Utilities</option>
                <option value="entertainment">🎬 Entertainment</option>
                <option value="shopping">🛍️ Shopping</option>
                <option value="other">📦 Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Date</label>
              <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Split equally among</label>
              <div className="selected-members" style={{ marginTop:4 }}>
                {group.members?.map(m => (
                  <div key={m._id} className="member-tag">
                    <div className="avatar" style={{ width:20, height:20, fontSize:9 }}>{m.avatar}</div>
                    {m.name}
                  </div>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" style={{ width:'100%' }} disabled={loading}>
              {loading ? 'Adding…' : 'Add Expense'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
