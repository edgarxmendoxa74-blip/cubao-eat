import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Coffee, Heart, Star, Users, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const About = () => {
    const [storeSettings, setStoreSettings] = useState({
        store_name: 'Fiesta Kainan sa Cubao',
        logo_url: '/logo.png'
    });

    useEffect(() => {
        const fetchStoreSettings = async () => {
            const { data } = await supabase.from('store_settings').select('*').limit(1).single();
            if (data) setStoreSettings(data);
        };
        fetchStoreSettings();
    }, []);

    return (
        <div className="page-wrapper">
            <header className="app-header">
                <div className="container header-container">
                    <Link to="/" className="brand">
                        <img src={storeSettings.logo_url || "/logo.png"} alt="Fiesta Kainan sa Cubao Logo" style={{ height: '50px' }} />
                    </Link>
                    <nav className="header-nav" style={{ display: 'flex', gap: '20px' }}>
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/contact" className="nav-link">Contact</Link>
                    </nav>
                </div>
            </header>

            <main className="container" style={{ padding: '80px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '20px' }}>Our <span style={{ color: 'var(--accent)' }}>Story</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto' }}>Serving the heart of Cubao with authentic Filipino flavors that bring people together.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '60px', alignItems: 'center', marginBottom: '100px' }}>
                    <div style={{ order: 2 }}>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '30px', color: 'var(--primary)', fontWeight: 800 }}>A Taste of <span style={{ color: 'var(--accent)' }}>Fiesta</span> in Every Meal</h2>
                        <p style={{ marginBottom: '20px', lineHeight: '1.8', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                            {storeSettings.store_name} was born out of a passion for the vibrant, festive culture of Filipino gatherings. We believe that every meal should feel like a celebration, whether you're having a quick lunch or hosting a large event.
                        </p>
                        <p style={{ lineHeight: '1.8', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                            Specializing in <strong>Packed Meals</strong>, <strong>Party Trays</strong>, and <strong>Special Fried Rice</strong>, we take pride in using traditional recipes and the freshest local ingredients. Our mission is to provide affordable, delicious, and high-quality food that captures the soul of Filipino cuisine.
                        </p>
                    </div>
                    <div style={{ order: 1 }}>
                        <img
                            src="https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&w=1200&q=80"
                            alt="Fiesta Food Presentation"
                            style={{ width: '100%', borderRadius: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', objectFit: 'cover', height: '500px' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginBottom: '80px' }}>
                    <div style={{ background: '#f8fafc', padding: '40px', borderRadius: '30px', textAlign: 'center' }}>
                        <div style={{ color: 'var(--accent)', marginBottom: '20px' }}><Star size={40} fill="var(--accent)" /></div>
                        <h3 style={{ marginBottom: '10px' }}>Quality First</h3>
                        <p style={{ color: 'var(--text-muted)' }}>We never compromise on the quality of our ingredients and preparation standards.</p>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '40px', borderRadius: '30px', textAlign: 'center' }}>
                        <div style={{ color: 'var(--accent)', marginBottom: '20px' }}><Heart size={40} fill="var(--accent)" /></div>
                        <h3 style={{ marginBottom: '10px' }}>Made with Love</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Our dishes are prepared with the same care and love as a home-cooked Filipino feast.</p>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '40px', borderRadius: '30px', textAlign: 'center' }}>
                        <div style={{ color: 'var(--accent)', marginBottom: '20px' }}><Users size={40} fill="var(--accent)" /></div>
                        <h3 style={{ marginBottom: '10px' }}>Community</h3>
                        <p style={{ color: 'var(--text-muted)' }}>We are proud to serve the Cubao community and beyond with food that brings people closer.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default About;
