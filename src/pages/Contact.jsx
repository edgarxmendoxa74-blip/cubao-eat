import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Facebook, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Contact = () => {
    const [storeSettings, setStoreSettings] = useState({
        store_name: 'Fiesta Kainan sa Cubao',
        address: 'Food Court, Farmers Plaza, General Araneta, Cubao, Quezon City',
        contact: '0922 811 2858',
        open_time: '10:00',
        close_time: '21:00',
        logo_url: '/logo.png'
    });

    useEffect(() => {
        const fetchStoreSettings = async () => {
            const { data } = await supabase.from('store_settings').select('*').limit(1).single();
            if (data) setStoreSettings(data);
        };
        fetchStoreSettings();
    }, []);

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${displayH}:${minutes} ${ampm}`;
    };

    return (
        <div className="page-wrapper">
            <header className="app-header">
                <div className="container header-container">
                    <Link to="/" className="brand">
                        <img src={storeSettings.logo_url || "/logo.png"} alt="Fiesta Kainan sa Cubao Logo" style={{ height: '50px' }} />
                    </Link>
                    <nav className="header-nav" style={{ display: 'flex', gap: '20px' }}>
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/contact" className="nav-link active">Contact</Link>
                    </nav>
                </div>
            </header>

            <main className="container" style={{ padding: '80px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '15px' }}>Visit <span style={{ color: 'var(--accent)' }}>Us</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>We'd love to serve you the best Filipino fiesta food in town!</p>
                </div>

                <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '60px' }}>
                    <div className="contact-card" style={{ background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid var(--border)', textAlign: 'center', transition: 'transform 0.3s ease' }}>
                        <div style={{ background: 'var(--bg)', width: '70px', height: '70px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--accent)', transform: 'rotate(-5deg)' }}>
                            <MapPin size={32} />
                        </div>
                        <h3 style={{ marginBottom: '12px', fontSize: '1.4rem' }}>Our Location</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6' }}>
                            {storeSettings.address}
                        </p>
                    </div>

                    <div className="contact-card" style={{ background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid var(--border)', textAlign: 'center', transition: 'transform 0.3s ease' }}>
                        <div style={{ background: 'var(--bg)', width: '70px', height: '70px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--accent)', transform: 'rotate(5deg)' }}>
                            <Phone size={32} />
                        </div>
                        <h3 style={{ marginBottom: '12px', fontSize: '1.4rem' }}>Contact</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6', fontWeight: 600 }}>
                            {storeSettings.contact}
                        </p>
                    </div>

                    <div className="contact-card" style={{ background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid var(--border)', textAlign: 'center', transition: 'transform 0.3s ease' }}>
                        <div style={{ background: 'var(--bg)', width: '70px', height: '70px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--accent)', transform: 'rotate(-3deg)' }}>
                            <Clock size={32} />
                        </div>
                        <h3 style={{ marginBottom: '12px', fontSize: '1.4rem' }}>Operating Hours</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6' }}>
                            Open daily from:<br />
                            <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{formatTime(storeSettings.open_time)} - {formatTime(storeSettings.close_time)}</strong>
                        </p>
                    </div>
                </div>

                {/* Social Media Section */}
                <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1e293b 100%)', color: 'white', borderRadius: '40px', padding: '80px 40px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }}></div>
                    <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '200px', height: '200px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }}></div>

                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '20px' }}>Stay Connected</h2>
                    <p style={{ marginBottom: '40px', color: 'rgba(255,255,255,0.8)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 40px' }}>Follow us for daily specials, events, and a behind-the-scenes look at our kitchen!</p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                        <a href="https://www.facebook.com/profile.php?id=61579032505526" target="_blank" rel="noopener noreferrer" className="btn-social" style={{ background: 'white', color: 'var(--primary)', padding: '15px 35px', borderRadius: '50px', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                            <Facebook size={22} />
                            Facebook
                        </a>
                        <a href="mailto:edgarxmendoxa74@gmail.com" className="btn-social" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '15px 35px', borderRadius: '50px', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', backdropFilter: 'blur(10px)' }}>
                            <Mail size={22} />
                            Email Us
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Contact;
