import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { groupsAPI, authAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function CreateGroup() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]       = useState('other');
  const [searchQ, setSearchQ]         = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading]         = useState(false);

  const handleSearch = async (q) => {
    setSearchQ(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await authAPI.searchUsers(q);
      setSearchResults(res.data.filter(u => !selectedMembers.find(m => m._id === u._id)));
    } catch { setSearchResults([]); }
  };

  const addMember    = (user) => { setSelectedMembers(prev => [...prev, user]); setSearchQ(''); setSearchResults([]); };
  const removeMember = (id)   => setSelectedMembers(prev => prev.filter(m => m._id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { addToast('Group name is required', 'error'); return; }
    setLoading(true);
    try {
      const res = await groupsAPI.create({ name, description, category, memberIds: selectedMembers.map(m => m._id) });
      addToast('Group created successfully! 🎉', 'success');
      navigate(`/groups/${res.data._id}`);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create group', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="layout">
      <Navbar />
      <main className="main">
        <Link to="/" className="back-link">← Back</Link>
        <div className="form-page">
          <h1>Create a Group</h1>
          <p>Gather your people and start splitting expenses</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Group Name *</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Goa Trip 2025" required />
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this group for?" />
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
            <div className="form-group">
              <label className="label">Add Members</label>
              <input className="input" value={searchQ} onChange={e => handleSearch(e.target.value)} placeholder="Search by name or email…" />
              {searchResults.length > 0 && (
                <div className="user-search-results">
                  {searchResults.map(u => (
                    <div key={u._id} className="user-result" onClick={() => addMember(u)}>
                      <div className="avatar">{u.avatar}</div>
                      <div>
                        <div style={{ fontWeight:500 }}>{u.name}</div>
                        <div style={{ fontSize:12, color:'var(--text-dim)' }}>{u.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedMembers.length > 0 && (
                <div className="selected-members">
                  {selectedMembers.map(m => (
                    <div key={m._id} className="member-tag">
                      <div className="avatar" style={{ width:20, height:20, fontSize:9 }}>{m.avatar}</div>
                      {m.name}
                      <button type="button" onClick={() => removeMember(m._id)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="btn btn-primary" style={{ width:'100%' }} disabled={loading}>
              {loading ? 'Creating…' : 'Create Group'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
