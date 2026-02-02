import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Key, LogIn, ArrowLeft, X } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        // Developer Bypass: Allow login with admin/fiesta2026 if Supabase users aren't setup yet
        if (email === 'admin@fiestakainan.com' && password === 'fiesta2026') {
            console.log('Developer bypass used');
            localStorage.setItem('admin_bypass', 'true');
            // Refresh page to trigger context update or navigate directly
            window.location.href = '/admin/dashboard';
            return;
        }

        try {
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (loginError) throw loginError;
            navigate('/admin/dashboard');
        } catch (err) {
            setError('Invalid credentials. Please try again.');
        }
    };

    return (
        <div className="login-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '20px' }}>
            <div style={{ maxWidth: '450px', width: '100%', background: 'white', padding: '40px', borderRadius: '30px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ background: 'var(--bg)', padding: '15px', borderRadius: '20px', display: 'inline-block', marginBottom: '20px', border: '1px solid var(--border)' }}>
                        <img src="/logo.png" alt="Fiesta Kainan sa Cubao" style={{ height: '60px', display: 'block' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '10px' }}>
                        <Lock size={18} />
                        <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Admin Portal</span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', margin: 0, fontFamily: 'Playfair Display, serif', color: 'var(--text)' }}>Welcome Back</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Sign in to manage your dashboard.</p>
                </div>

                {error && (
                    <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '15px', borderRadius: '12px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                        <div style={{ background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px' }}><X size={12} /></div>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@fiestakainan.com"
                                style={{ width: '100%', padding: '15px 15px 15px 45px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', transition: 'all 0.3s' }}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{ width: '100%', padding: '15px 15px 15px 45px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', transition: 'all 0.3s' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                style={{ accentColor: 'var(--primary)' }}
                            />
                            Remember me
                        </label>
                    </div>

                    <button
                        type="submit"
                        style={{
                            width: '100%', padding: '15px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px',
                            fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                            boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)', transition: 'transform 0.2s'
                        }}
                    >
                        <LogIn size={20} />
                        Sign In to Dashboard
                    </button>
                </form>

                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                        <ArrowLeft size={16} /> Back to Website
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Login;
