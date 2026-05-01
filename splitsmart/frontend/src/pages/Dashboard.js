import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { groupsAPI, settlementsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CAT_EMOJI = { trip:'✈️', home:'🏠', food:'🍔', event:'🎉', work:'💼', other:'📦' };

export default function Dashboard() {
  const { user } = useAuth();
  const [groups, setGroups]   = useState([]);
  const [summary, setSummary] = useState({ totalOwed:0, totalOwing:0, netBalance:0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([groupsAPI.list(), settlementsAPI.summary()])
      .then(([gRes, sRes]) => { setGroups(gRes.data); setSummary(sRes.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="layout"><Navbar /><div className="loading-screen"><div className="spinner" /></div></div>;

  return (
    <div className="layout">
      <Navbar />
      <main className="main">
        <div className="page-header">
          <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Here's your expense overview across all groups</p>
        </div>

        <div className="summary-grid">
          <div className="summary-card">
            <div className="label-sm">You're owed</div>
            <div className="value positive">₹{summary.totalOwed.toLocaleString()}</div>
          </div>
          <div className="summary-card">
            <div className="label-sm">You owe</div>
            <div className="value negative">₹{summary.totalOwing.toLocaleString()}</div>
          </div>
          <div className="summary-card">
            <div className="label-sm">Net balance</div>
            <div className={`value ${summary.netBalance >= 0 ? 'positive' : 'negative'}`}>
              {summary.netBalance >= 0 ? '+' : ''}₹{summary.netBalance.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="section-header">
          <h2>Your Groups</h2>
          <Link to="/groups/new" className="btn btn-primary btn-sm">+ New Group</Link>
        </div>

        {groups.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🤝</div>
            <h3>No groups yet</h3>
            <p>Create a group to start splitting expenses with friends</p>
            <Link to="/groups/new" className="btn btn-primary" style={{ marginTop:20, display:'inline-flex' }}>
              Create your first group
            </Link>
          </div>
        ) : (
          <div className="groups-grid">
            {groups.map(group => (
              <Link key={group._id} to={`/groups/${group._id}`} className="group-card">
                <div className="group-icon">{CAT_EMOJI[group.category] || '📦'}</div>
                <div className="group-name">{group.name}</div>
                <div className="group-meta">{group.description || 'No description'}</div>
                <div className="member-stack">
                  {group.members?.slice(0,5).map(m => (
                    <div key={m._id} className="avatar" title={m.name}>{m.avatar}</div>
                  ))}
                  {group.members?.length > 5 && <div className="avatar">+{group.members.length - 5}</div>}
                </div>
                <div className="group-stats">
                  <div className="stat"><span>₹{(group.totalExpenses||0).toLocaleString()}</span>Total spent</div>
                  <div className="stat"><span>{group.expenseCount}</span>Expenses</div>
                  <div className="stat"><span>{group.members?.length}</span>Members</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
