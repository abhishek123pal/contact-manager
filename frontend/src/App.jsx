import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function App() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [searchTerm, setSearchTerm] = useState('');
  
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isRegister, setIsRegister] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', password: '' });

  const fetchContacts = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/api/contacts`, {
        headers: { 'x-auth-token': token }
      });
      setContacts(res.data);
    } catch (err) {
      if (err.response?.status === 401) logout();
    }
  };

  useEffect(() => {
    if (token) fetchContacts();
  }, [token]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const path = isRegister ? 'register' : 'login';
    try {
      const res = await axios.post(`${API_URL}/api/${path}`, authForm);
      if (!isRegister) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
      } else {
        alert("Registration successful! Please login.");
        setIsRegister(false);
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Authentication failed");
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setContacts([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/contacts`, form, {
        headers: { 'x-auth-token': token }
      });
      setForm({ name: '', email: '', phone: '' });
      fetchContacts();
    } catch (err) {
      console.error("Error adding contact", err);
    }
  };

  const deleteContact = async (id) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      try {
        await axios.delete(`${API_URL}/api/contacts/${id}`, {
          headers: { 'x-auth-token': token }
        });
        fetchContacts();
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- LOGIN / REGISTER UI ---
  if (!token) {
    return (
      <div className="container-fluid vh-100 d-flex justify-content-center align-items-center bg-primary bg-gradient">
        <div className="card shadow-lg p-4 border-0" style={{ width: '400px', borderRadius: '20px' }}>
          <div className="text-center mb-4">
            <i className="bi bi-shield-lock-fill text-primary display-4"></i>
            <h2 className="fw-bold mt-2">{isRegister ? 'Join Us' : 'Login'}</h2>
          </div>
          <form onSubmit={handleAuth}>
            <div className="form-floating mb-3">
              <input type="email" className="form-control" id="email" placeholder="Email" required
                onChange={e => setAuthForm({...authForm, email: e.target.value})} />
              <label htmlFor="email">Email address</label>
            </div>
            <div className="form-floating mb-3">
              <input type="password" className="form-control" id="pw" placeholder="Password" required
                onChange={e => setAuthForm({...authForm, password: e.target.value})} />
              <label htmlFor="pw">Password</label>
            </div>
            <button className="btn btn-primary w-100 py-3 fw-bold rounded-pill shadow">
              {isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>
          <div className="text-center mt-4">
            <span className="text-muted small" style={{ cursor: 'pointer' }} onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? "Already have an account? Login" : "Don't have an account? Register Now"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN CONTACT MANAGER UI ---
  return (
    <div className="container-fluid min-vh-100 bg-light py-4">
      <div className="container">
        {/* Navigation Bar */}
        <div className="d-flex justify-content-between align-items-center mb-5 p-3 bg-white shadow-sm rounded-4">
          <h2 className="text-primary fw-bold mb-0">
            <i className="bi bi-person-rolodex me-2"></i>Contact Management
          </h2>
          <button className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm" onClick={logout}>
            <i className="bi bi-box-arrow-right me-2"></i>Logout
          </button>
        </div>

        <div className="row g-4">
          {/* LEFT: Add Form */}
          <div className="col-lg-5">
            <div className="card border-0 shadow rounded-4 p-4 sticky-top" style={{ top: "20px" }}>
              <h4 className="fw-bold mb-4 text-dark">
                <i className="bi bi-plus-circle-fill me-2 text-primary"></i>Add New Contact
              </h4>
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-12">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><i className="bi bi-person text-muted"></i></span>
                    <input className="form-control border-start-0 ps-0" placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                  </div>
                </div>
                <div className="col-12">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><i className="bi bi-envelope text-muted"></i></span>
                    <input className="form-control border-start-0 ps-0" type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                  </div>
                </div>
                <div className="col-12">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><i className="bi bi-phone text-muted"></i></span>
                    <input className="form-control border-start-0 ps-0" placeholder="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
                  </div>
                </div>
                <div className="col-12 mt-4">
                  <button className="btn btn-primary w-100 py-2 fw-bold rounded-3 shadow-sm">Save Contact</button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT: Contact List */}
          <div className="col-lg-7">
            <div className="bg-white p-4 shadow rounded-4 min-vh-50">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0">Your Directory</h4>
                <span className="badge bg-primary rounded-pill px-3 py-2">{filteredContacts.length} Contacts</span>
              </div>

              {/* Search Bar */}
              <div className="input-group mb-4 shadow-sm rounded-pill overflow-hidden border">
                <span className="input-group-text bg-white border-0 ps-3"><i className="bi bi-search"></i></span>
                <input type="text" className="form-control border-0 py-2" placeholder="Search by name or email..." 
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>

              {/* List Wrapper */}
              <div className="list-group list-group-flush rounded-3 overflow-auto" style={{ maxHeight: "450px" }}>
                {filteredContacts.length > 0 ? (
                  filteredContacts.map(c => (
                    <div key={c._id} className="list-group-item d-flex justify-content-between align-items-center py-3 border-bottom border-light">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold me-3" style={{ width: "45px", height: "45px" }}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h6 className="mb-0 fw-bold">{c.name}</h6>
                          <div className="text-muted small">
                            <i className="bi bi-envelope me-1"></i>{c.email}
                            <span className="mx-2">|</span>
                            <i className="bi bi-phone me-1"></i>{c.phone}
                          </div>
                        </div>
                      </div>
                      <button className="btn btn-outline-danger btn-sm rounded-circle border-0 p-2" onClick={() => deleteContact(c._id)}>
                        <i className="bi bi-trash3-fill"></i>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-inbox text-muted display-1"></i>
                    <p className="mt-3 text-muted">No contacts found. Add your first one!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}