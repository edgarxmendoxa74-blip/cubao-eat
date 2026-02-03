import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    ShoppingBag,
    Plus,
    Minus,
    X,
    MessageSquare,
    MapPin,
    Phone,
    Info,
    Facebook,
    Star,
    Coffee,
    UtensilsCrossed,
    Clock,
    User,
    Trash2,
    Copy,
    CreditCard,
    ChevronLeft,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { categories as initialCategories, menuItems as initialMenuItems } from '../data/MenuData';
import { supabase } from '../supabaseClient';

// Helper to safely parse localized storage data
const getLocalData = (key, fallback) => {
    try {
        const saved = localStorage.getItem(key);
        if (!saved) return fallback;
        const parsed = JSON.parse(saved);
        // Ensure we have actual data, not just an empty array
        if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(fallback) && fallback.length > 0) {
            return fallback;
        }
        return parsed || fallback;
    } catch (e) {
        return fallback;
    }
};

// Normalize menu items (ensure category_id is used for both fallback and DB)
const normalizeItems = (items) => {
    return items.map(item => ({
        ...item,
        category_id: item.category_id || item.categoryId // Handle both camelCase and snake_case
    }));
};

// Memoized menu item component
const MenuItem = React.memo(({ item, isOpen, openProductSelection }) => (
    <div className="menu-item-card" style={{ opacity: item.out_of_stock ? 0.6 : 1 }}>
        <div style={{ position: 'relative' }}>
            <img src={item.image} alt={item.name} className="menu-item-image" loading="lazy" />
            {item.promo_price && <span style={{ position: 'absolute', top: '10px', left: '10px', background: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>PROMO</span>}
            {item.out_of_stock && <span style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, borderRadius: '20px' }}>OUT OF STOCK</span>}
        </div>
        <div className="menu-item-info">
            <h3 className="menu-item-name">{item.name}</h3>
            <p className="menu-item-desc">{item.description}</p>
            <div className="menu-item-footer">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {item.promo_price ? (
                        <>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.8rem' }}>₱{item.price}</span>
                            <span className="menu-item-price" style={{ color: '#ef4444' }}>₱{item.promo_price}</span>
                        </>
                    ) : (
                        <span className="menu-item-price">₱{item.price}</span>
                    )}
                </div>
                <button
                    className="btn-primary"
                    disabled={item.out_of_stock || !isOpen}
                    onClick={() => openProductSelection(item)}
                    style={{ padding: '8px 16px', fontSize: '0.8rem', opacity: (item.out_of_stock || !isOpen) ? 0.5 : 1 }}
                >
                    <Plus size={14} style={{ marginRight: '5px' }} /> Add to Cart
                </button>
            </div>
        </div>
    </div>
));

const Home = () => {
    const [cart, setCart] = useState([]);
    // INSTANT LOAD: Initialize states from LocalStorage or Fallback
    const [categories, setCategories] = useState(() => getLocalData('categories', initialCategories));
    const [items, setItems] = useState(() => normalizeItems(getLocalData('menuItems', initialMenuItems)));

    // Only show loading if we have ABSOLUTELY no items (rare if initialMenuItems exists)
    const [isLoading, setIsLoading] = useState(items.length === 0);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [activeCategory, setActiveCategory] = useState(() => categories[0]?.id || '');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    const [paymentSettings, setPaymentSettings] = useState(() => getLocalData('paymentSettings', []));

    const [orderTypes, setOrderTypes] = useState(() => getLocalData('orderTypes', [
        { id: 'dine-in', name: 'Dine-in' },
        { id: 'pickup', name: 'Take Out' },
        { id: 'delivery', name: 'Delivery' }
    ]));

    const [storeSettings, setStoreSettings] = useState(() => {
        const fallback = {
            manual_status: 'auto',
            open_time: '10:00',
            close_time: '01:00',
            store_name: 'Fiesta Kainan sa Cubao',
            address: 'Food Court, Farmers Plaza, General Araneta, Cubao, Quezon City',
            contact: '0922 811 2858',
            logo_url: '/logo.png',
            banner_images: [
                'https://images.unsplash.com/photo-1517701604599-bb29b565094d?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80'
            ]
        };
        const saved = getLocalData('storeSettings', fallback);
        // Merge saved with fallback to ensure all keys exist
        return {
            ...fallback,
            ...saved,
            // Specifically ensure banner_images has some content
            banner_images: (saved.banner_images && saved.banner_images.length > 0) ? saved.banner_images : fallback.banner_images
        };
    });

    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

    // Store status logic - Fixed to use PHT (Asia/Manila)
    const isStoreOpen = () => {
        if (storeSettings.manual_status === 'open') return true;
        if (storeSettings.manual_status === 'closed') return false;

        try {
            const manilaTimeParts = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Manila',
                hour: 'numeric',
                minute: 'numeric',
                hour12: false
            }).formatToParts(new Date());

            const hours = parseInt(manilaTimeParts.find(p => p.type === 'hour').value);
            const minutes = parseInt(manilaTimeParts.find(p => p.type === 'minute').value);
            const currentTime = hours * 60 + minutes;

            const [openH, openM] = (storeSettings.open_time || '10:00').split(':').map(Number);
            const [closeH, closeM] = (storeSettings.close_time || '01:00').split(':').map(Number);

            const openMinutes = openH * 60 + openM;
            const closeMinutes = closeH * 60 + closeM;

            if (closeMinutes < openMinutes) {
                return currentTime >= openMinutes || currentTime < closeMinutes;
            }
            return currentTime >= openMinutes && currentTime < closeMinutes;
        } catch (e) {
            return true;
        }
    };

    const isOpen = isStoreOpen();

    // Background fetching with LocalStorage sync
    useEffect(() => {
        const fetchUpdates = async () => {
            if (items.length === 0) setIsLoading(true);

            try {
                const [
                    { data: catData, error: catErr },
                    { data: itemData, error: itemErr },
                    { data: payData },
                    { data: typeData },
                    { data: storeData }
                ] = await Promise.all([
                    supabase.from('categories').select('*').order('sort_order', { ascending: true }),
                    supabase.from('menu_items').select('*').order('sort_order', { ascending: true }),
                    supabase.from('payment_settings').select('*').eq('is_active', true).order('created_at', { ascending: true }),
                    supabase.from('order_types').select('*').eq('is_active', true).order('created_at', { ascending: true }),
                    supabase.from('store_settings').select('*').limit(1).single()
                ]);

                if (catErr || itemErr) throw new Error("Supabase fetch failed");

                if (catData && catData.length > 0) {
                    setCategories(catData);
                    localStorage.setItem('categories', JSON.stringify(catData));
                    if (!activeCategory) {
                        setActiveCategory(catData[0].id);
                    }
                }

                if (itemData && itemData.length > 0) {
                    setItems(normalizeItems(itemData));
                    localStorage.setItem('menuItems', JSON.stringify(itemData));
                }

                // Other settings
                if (payData) { setPaymentSettings(payData); localStorage.setItem('paymentSettings', JSON.stringify(payData)); }
                if (typeData) { setOrderTypes(typeData); localStorage.setItem('orderTypes', JSON.stringify(typeData)); }
                if (storeData) {
                    setStoreSettings(prev => ({
                        ...prev,
                        ...storeData,
                        banner_images: (storeData.banner_images && storeData.banner_images.length > 0) ? storeData.banner_images : prev.banner_images
                    }));
                    localStorage.setItem('storeSettings', JSON.stringify(storeData));
                }

            } catch (error) {
                console.error("Background fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUpdates();
    }, []);

    // Slideshow functions
    const nextBanner = useCallback(() => {
        const count = (storeSettings.banner_images || []).length;
        if (count > 0) setCurrentBannerIndex(prev => (prev + 1) % count);
    }, [storeSettings.banner_images]);

    const prevBanner = useCallback(() => {
        const count = (storeSettings.banner_images || []).length;
        if (count > 0) setCurrentBannerIndex(prev => (prev - 1 + count) % count);
    }, [storeSettings.banner_images]);

    useEffect(() => {
        const bannerCount = (storeSettings.banner_images || []).length;
        if (bannerCount === 0) return;
        const timer = setInterval(nextBanner, 5000);
        return () => clearInterval(timer);
    }, [nextBanner, storeSettings.banner_images]);

    // Selection state for products with options
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectionOptions, setSelectionOptions] = useState({
        variation: null,
        flavors: [],
        addons: []
    });

    // Order type and payment state
    const [orderType, setOrderType] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        phone: '',
        table_number: '',
        address: '',
        landmark: '',
        pickup_time: ''
    });

    const openProductSelection = useCallback((item) => {
        const firstVariation = (item.variations || []).find(v => !v.disabled);
        setSelectedProduct(item);
        setSelectionOptions({
            variation: firstVariation || null,
            flavors: [],
            addons: []
        });
    }, []);

    const addToCart = (item, options) => {
        const cartItemId = `${item.id}-${options.variation?.name || ''}-${options.flavors.sort().join(',')}-${options.addons.map(a => a.name).join(',')}`;
        const existing = cart.find(i => i.cartItemId === cartItemId);

        const variationPrice = options.variation ? Number(options.variation.price) : 0;
        const basePrice = Number(item.promo_price || item.price);

        let price;
        if (item.name?.toLowerCase().includes('pork ribs')) {
            price = basePrice + variationPrice;
        } else {
            price = variationPrice > 0 ? variationPrice : basePrice;
        }
        const addonsPrice = options.addons.reduce((sum, a) => sum + Number(a.price), 0);
        const finalPrice = price + addonsPrice;

        if (existing) {
            setCart(cart.map(i => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setCart([...cart, {
                ...item,
                cartItemId,
                selectedVariation: options.variation,
                selectedFlavors: options.flavors,
                selectedAddons: options.addons,
                finalPrice,
                quantity: 1
            }]);
        }
        setSelectedProduct(null);
    };

    const removeFromCart = (cartItemId) => {
        setCart(cart.map(i => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity > 1 ? i.quantity - 1 : i.quantity } : i));
    };

    const deleteFromCart = (cartItemId) => {
        setCart(cart.filter(i => i.cartItemId !== cartItemId));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handlePlaceOrder = async () => {
        if (!orderType) {
            alert('Please select an order type (Dine-in, Pickup, or Delivery).');
            return;
        }

        const { name, phone, table_number, address, pickup_time } = customerDetails;
        if (orderType === 'dine-in' && (!name || !table_number)) { alert('Please provide your Name and Table Number.'); return; }
        if (orderType === 'pickup' && (!name || !phone || !pickup_time)) { alert('Please provide Name, Phone Number, and Pickup Time.'); return; }
        if (orderType === 'delivery' && (!name || !phone || !address)) { alert('Please provide Name, Phone Number, and Delivery Address.'); return; }

        if (!paymentMethod) { alert('Please select a payment method.'); return; }

        setIsSubmitting(true);

        try {
            const itemDetails = cart.map(item => {
                let d = `${item.name} (x${item.quantity})`;
                if (item.selectedVariation) d += ` - ${item.selectedVariation.name}`;
                if (item.selectedFlavors && item.selectedFlavors.length > 0) d += ` [${item.selectedFlavors.join(', ')}]`;
                if (item.selectedAddons.length > 0) d += ` + ${item.selectedAddons.map(a => a.name).join(', ')}`;
                return d;
            });

            const newOrder = {
                order_type: orderType,
                payment_method: paymentMethod,
                customer_details: customerDetails,
                items: itemDetails,
                total_amount: cartTotal,
                status: 'Pending'
            };

            const { error } = await supabase.from('orders').insert([newOrder]);
            if (error) {
                console.error('Error saving order to Supabase:', error);
                alert('We had trouble saving your order to our system, but you can still proceed to Messenger.');
            }

            // Backup to LocalStorage
            const localOrder = { ...newOrder, id: Date.now(), timestamp: new Date().toISOString() };
            const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            localStorage.setItem('orders', JSON.stringify([...existingOrders, localOrder]));

            // Prepare Messenger message (simplified to avoid spam detection)
            const summary = itemDetails.join('\n');
            let info = `Name: ${customerDetails.name}`;
            if (orderType === 'dine-in') info += ` | Table: ${customerDetails.table_number}`;
            if (orderType === 'pickup') info += ` | Phone: ${customerDetails.phone} | Time: ${customerDetails.pickup_time}`;
            if (orderType === 'delivery') info += ` | Phone: ${customerDetails.phone} | Address: ${customerDetails.address}`;

            const message = `Hi! New order for ${customerDetails.name}:
            
${summary}

Total: P${cartTotal}
Type: ${orderType}
${info}`.trim();

            const messengerUrl = `https://m.me/61579032505526?text=${encodeURIComponent(message)}`;

            setOrderSuccess(true);
            setCart([]);

            const opened = window.open(messengerUrl, '_blank');
            if (!opened) {
                console.log("Popup blocked or failed to open automatically.");
            }
        } catch (err) {
            console.error('Order process error:', err);
            alert('Something went wrong. Please try again or contact us directly.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${displayH}:${minutes} ${ampm}`;
    };

    // MEMO: Filtered items memoized to prevent expensive re-filtering
    const filteredItems = useMemo(() => {
        if (!activeCategory || activeCategory === 'all') return items;
        return items.filter(item => item.category_id === activeCategory);
    }, [items, activeCategory]);

    return (
        <div className="page-wrapper">
            {/* Store Closed Overlay */}
            {!isOpen && (
                <div style={{ background: 'var(--accent)', color: 'white', textAlign: 'center', padding: '12px', position: 'sticky', top: 0, zIndex: 1200, fontWeight: 700, fontSize: '0.9rem' }}>
                    <Clock size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    WE ARE CURRENTLY CLOSED. Our operating hours are {formatTime(storeSettings.open_time) || '10:00 AM'} to {formatTime(storeSettings.close_time) || '1:00 AM'}. Orders are disabled.
                </div>
            )}

            <header className="app-header">
                <div className="container header-container">
                    <Link to="/" className="brand">
                        <img src={storeSettings.logo_url || "/logo.png"} alt="Fiesta Kainan sa Cubao Logo" style={{ height: '50px' }} />
                    </Link>

                    <nav className="header-nav" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/contact" className="nav-link">Contact</Link>
                        <button className="btn-accent" onClick={() => setIsCartOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
                            <ShoppingBag size={18} />
                            <span>Cart ({cartCount})</span>
                        </button>
                    </nav>
                </div>
            </header>

            {/* Sticky Category Slider */}
            <div className="category-slider-wrapper">
                <div className="container">
                    <div className="category-slider">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`category-slide-btn ${activeCategory === cat.id ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveCategory(cat.id);
                                    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <section className="hero-section" style={{ overflow: 'hidden' }}>
                <div className="container hero-split">
                    <div className="hero-content">
                        <h1>Fiesta Kainan <span style={{ color: 'var(--accent)' }}>sa Cubao</span></h1>
                        <p>Specializing in <strong>Packed Meals</strong>, <strong>Party Trays</strong>, and <strong>Special Fried Rice</strong>. Experience the authentic taste of a Filipino fiesta in every bite!</p>
                    </div>
                    <div className="hero-image-container">
                        {(storeSettings.banner_images || []).map((url, i) => (
                            <img
                                key={i}
                                src={url}
                                alt={`Hero Banner ${i + 1}`}
                                className="hero-image"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    opacity: currentBannerIndex === i ? 1 : 0,
                                    transition: 'opacity 1s ease-in-out',
                                    zIndex: currentBannerIndex === i ? 1 : 0
                                }}
                            />
                        ))}
                        <button onClick={prevBanner} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', padding: '10px', cursor: 'pointer', zIndex: 10 }}><ChevronLeft size={24} color="var(--primary)" /></button>
                        <button onClick={nextBanner} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', padding: '10px', cursor: 'pointer', zIndex: 10 }}><ChevronRight size={24} color="var(--primary)" /></button>
                    </div>
                </div>
            </section>


            <main className="container" id="menu" style={{ padding: '80px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '3rem', marginBottom: '10px', color: 'var(--primary)' }}>Our Menu</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Pick your favorites and add them to your cart.</p>
                </div>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                        <p style={{ color: 'var(--text-muted)' }}>Loading delicious menu...</p>
                    </div>
                ) : (
                    <>
                        {filteredItems.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                <UtensilsCrossed size={48} style={{ color: 'var(--text-muted)', marginBottom: '20px', opacity: 0.5 }} />
                                <h3>No items found in this category</h3>
                                <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setActiveCategory('all')}>View All Items</button>
                            </div>
                        ) : (
                            <div className="menu-grid">
                                {filteredItems.map(item => (
                                    <MenuItem
                                        key={item.id}
                                        item={item}
                                        isOpen={isOpen}
                                        openProductSelection={openProductSelection}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Selection Modal (Remains same) */}
            {selectedProduct && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', maxWidth: '500px', width: '100%', borderRadius: '24px', padding: '30px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <img src={selectedProduct.image} style={{ width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover' }} alt="" />
                            <div><h2 style={{ margin: 0 }}>{selectedProduct.name}</h2><p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{selectedProduct.description}</p></div>
                        </div>

                        {selectedProduct.variations && selectedProduct.variations.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontWeight: 700, display: 'block', marginBottom: '10px' }}>Select Size/Variation</label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {selectedProduct.variations.map(v => (
                                        <button
                                            key={v.name}
                                            disabled={v.disabled}
                                            onClick={() => setSelectionOptions({ ...selectionOptions, variation: v })}
                                            style={{
                                                padding: '8px 15px', borderRadius: '10px', border: '1px solid var(--primary)',
                                                background: selectionOptions.variation?.name === v.name ? 'var(--primary)' : 'white',
                                                color: selectionOptions.variation?.name === v.name ? 'white' : 'var(--primary)',
                                                cursor: v.disabled ? 'not-allowed' : 'pointer',
                                                opacity: v.disabled ? 0.3 : 1
                                            }}
                                        >
                                            {v.name} (+₱{v.price}) {v.disabled && '(Out of Stock)'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedProduct.addons && selectedProduct.addons.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontWeight: 700, display: 'block', marginBottom: '10px' }}>Add-ons (Optional)</label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {selectedProduct.addons.map(a => (
                                        <button
                                            key={a.name}
                                            disabled={a.disabled}
                                            onClick={() => {
                                                const exists = selectionOptions.addons.find(x => x.name === a.name);
                                                if (exists) {
                                                    setSelectionOptions({ ...selectionOptions, addons: selectionOptions.addons.filter(x => x.name !== a.name) });
                                                } else {
                                                    setSelectionOptions({ ...selectionOptions, addons: [...selectionOptions.addons, a] });
                                                }
                                            }}
                                            style={{
                                                padding: '8px 15px', borderRadius: '10px', border: '1px solid var(--primary)',
                                                background: selectionOptions.addons.find(x => x.name === a.name) ? 'var(--primary)' : 'white',
                                                color: selectionOptions.addons.find(x => x.name === a.name) ? 'white' : 'var(--primary)',
                                                cursor: a.disabled ? 'not-allowed' : 'pointer',
                                                opacity: a.disabled ? 0.3 : 1
                                            }}
                                        >
                                            + {a.name} (₱{a.price}) {a.disabled && '(Out of Stock)'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {selectedProduct.flavors && selectedProduct.flavors.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontWeight: 700, display: 'block', marginBottom: '10px' }}>Select Flavors (You can pick multiple)</label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {selectedProduct.flavors.map(f => {
                                        const name = typeof f === 'string' ? f : f.name;
                                        const disabled = typeof f === 'object' ? f.disabled : false;
                                        if (disabled) return null;
                                        return (
                                            <button
                                                key={name}
                                                onClick={() => {
                                                    const exists = selectionOptions.flavors.includes(name);
                                                    let newFlavors;
                                                    if (exists) {
                                                        newFlavors = selectionOptions.flavors.filter(x => x !== name);
                                                    } else {
                                                        newFlavors = [...selectionOptions.flavors, name];
                                                    }
                                                    setSelectionOptions({ ...selectionOptions, flavors: newFlavors });
                                                }}
                                                style={{
                                                    padding: '8px 15px', borderRadius: '10px',
                                                    border: '1px solid var(--primary)',
                                                    background: selectionOptions.flavors.includes(name) ? 'var(--primary)' : 'white',
                                                    color: selectionOptions.flavors.includes(name) ? 'white' : 'var(--primary)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <button className="btn-primary" style={{ width: '100%', padding: '15px', fontWeight: 700, fontSize: '1.1rem' }} onClick={() => addToCart(selectedProduct, selectionOptions)}>
                            Add to Cart - ₱{(
                                (selectionOptions.variation && Number(selectionOptions.variation.price) > 0)
                                    ? (selectedProduct.name?.toLowerCase().includes('pork ribs')
                                        ? Number(selectedProduct.promo_price || selectedProduct.price) + Number(selectionOptions.variation.price)
                                        : Number(selectionOptions.variation.price))
                                    : Number(selectedProduct.promo_price || selectedProduct.price)
                            ) + selectionOptions.addons.reduce((sum, a) => sum + Number(a.price), 0)}
                        </button>
                    </div>
                </div>
            )}

            {/* Checkout Modal (Remains same) */}
            {isCheckoutOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', maxWidth: '500px', width: '100%', borderRadius: '24px', padding: '30px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => { setIsCheckoutOpen(false); setOrderSuccess(false); }} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>

                        {orderSuccess ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
                                <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Order Placed!</h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Your order has been recorded. Click the button below to confirm it via Messenger if the chat didn't open automatically.</p>
                                <button
                                    className="btn-accent"
                                    onClick={() => {
                                        const message = "Hello! I just placed an order on your website.";
                                        window.open(`https://m.me/61579032505526?text=${encodeURIComponent(message)}`, '_blank');
                                    }}
                                    style={{ width: '100%', padding: '15px', borderRadius: '12px', fontWeight: 800 }}
                                >
                                    Open Messenger Chat
                                </button>
                                <button
                                    onClick={() => { setIsCheckoutOpen(false); setOrderSuccess(false); }}
                                    style={{ marginTop: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <>
                                <h2 style={{ marginBottom: '30px', fontSize: '1.8rem', color: 'var(--primary)' }}>Checkout</h2>

                                <div style={{ marginBottom: '30px' }}>
                                    <div style={{ marginBottom: '30px' }}>
                                        <label style={{ fontWeight: 700, fontSize: '1rem', display: 'block', marginBottom: '15px' }}>Payment Method</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                            <button
                                                onClick={() => setPaymentMethod('Cash/COD')}
                                                style={{
                                                    padding: '15px', borderRadius: '15px', border: '2px solid',
                                                    borderColor: paymentMethod === 'Cash/COD' ? 'var(--primary)' : '#e2e8f0',
                                                    background: paymentMethod === 'Cash/COD' ? '#f0f9ff' : 'white',
                                                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>💵</div>
                                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>Cash / COD</div>
                                            </button>
                                            {paymentSettings.map(method => (
                                                <button
                                                    key={method.id}
                                                    onClick={() => setPaymentMethod(method.id)}
                                                    style={{
                                                        padding: '15px', borderRadius: '15px', border: '2px solid',
                                                        borderColor: paymentMethod === method.id ? 'var(--primary)' : '#e2e8f0',
                                                        background: paymentMethod === method.id ? '#f0f9ff' : 'white',
                                                        cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>💳</div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>{method.name}</div>
                                                </button>
                                            ))}
                                        </div>

                                        {paymentMethod && paymentMethod !== 'Cash/COD' && (
                                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                                {paymentSettings.find(m => m.id === paymentMethod) ? (
                                                    (() => {
                                                        const method = paymentSettings.find(m => m.id === paymentMethod);
                                                        return (
                                                            <div style={{ textAlign: 'center' }}>
                                                                <h4 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Send {method.name} Payment</h4>
                                                                {method.qr_url && (
                                                                    <div style={{ background: 'white', padding: '10px', borderRadius: '12px', display: 'inline-block', marginBottom: '20px' }}>
                                                                        <img src={method.qr_url} style={{ width: '180px', height: '180px', borderRadius: '10px', objectFit: 'contain' }} alt="QR Code" />
                                                                    </div>
                                                                )}
                                                                <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Account Number</div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
                                                                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>{method.account_number}</div>
                                                                        <button
                                                                            onClick={() => { navigator.clipboard.writeText(method.account_number); alert('Copied!'); }}
                                                                            style={{ border: 'none', background: 'var(--primary)', color: 'white', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.8rem' }}
                                                                        >
                                                                            <Copy size={14} /> Copy
                                                                        </button>
                                                                    </div>
                                                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>{method.account_name}</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()
                                                ) : (
                                                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Details not found.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ marginBottom: '30px' }}>
                                        <label style={{ fontWeight: 700, fontSize: '1rem', display: 'block', marginBottom: '15px' }}>Select Order Type</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
                                            {orderTypes.map(type => (
                                                <button key={type.id} onClick={() => setOrderType(type.id)} style={{ padding: '8px', fontSize: '0.9rem', borderRadius: '12px', border: '1px solid var(--primary)', background: orderType === type.id ? 'var(--primary)' : 'white', color: orderType === type.id ? 'white' : 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>{type.name}</button>
                                            ))}
                                        </div>
                                    </div>

                                    {orderType && (
                                        <div style={{ marginBottom: '30px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                <div><label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: 600 }}>Full Name</label><input type="text" value={customerDetails.name} onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })} style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0' }} /></div>
                                                {orderType === 'dine-in' && <div><label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: 600 }}>Table Number</label><input type="text" value={customerDetails.table_number} onChange={(e) => setCustomerDetails({ ...customerDetails, table_number: e.target.value })} style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0' }} /></div>}
                                                {orderType !== 'dine-in' && <div><label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: 600 }}>Phone</label><input type="tel" value={customerDetails.phone} onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })} style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0' }} /></div>}
                                                {orderType === 'pickup' && <div><label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: 600 }}>Time</label><input type="time" value={customerDetails.pickup_time} onChange={(e) => setCustomerDetails({ ...customerDetails, pickup_time: e.target.value })} style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0' }} /></div>}
                                                {orderType === 'delivery' && <div><label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: 600 }}>Address</label><textarea value={customerDetails.address} onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })} style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0' }} /></div>}
                                                {!['dine-in', 'pickup', 'delivery'].includes(orderType) && <div><label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: 600 }}>Notes / Instructions</label><textarea value={customerDetails.landmark} onChange={(e) => setCustomerDetails({ ...customerDetails, landmark: e.target.value })} placeholder="Any specific requests..." style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0' }} /></div>}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Amount:</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>₱{cartTotal}</span>
                                    </div>

                                    <button
                                        className="btn-accent"
                                        onClick={handlePlaceOrder}
                                        disabled={isSubmitting}
                                        style={{ width: '100%', padding: '18px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 800, fontSize: '1.1rem', opacity: isSubmitting ? 0.7 : 1 }}
                                    >
                                        {isSubmitting ? (
                                            <>Processing...</>
                                        ) : (
                                            <><MessageSquare size={22} /> Confirm Order</>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {isCartOpen && (
                <div style={{ position: 'fixed', top: 0, right: 0, width: '450px', height: '100vh', background: 'white', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', zIndex: 1100, padding: '30px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}><h2>Your Cart</h2><button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button></div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {cart.map(item => (
                            <div key={item.cartItemId} style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'flex-start' }}>
                                <img src={item.image} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0 }}>{item.name}</h4>
                                    <p style={{ margin: '2px 0 5px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {item.selectedVariation?.name}
                                        {item.selectedFlavors && item.selectedFlavors.length > 0 ? ` | ${item.selectedFlavors.join(', ')}` : ''}
                                    </p>
                                    <span style={{ fontWeight: 700 }}>₱{item.finalPrice}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <button onClick={() => removeFromCart(item.cartItemId)} style={{ border: '1px solid var(--border)', background: 'none', padding: '2px', borderRadius: '4px' }}><Minus size={14} /></button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => addToCart(item, { variation: item.selectedVariation, flavors: item.selectedFlavors, addons: item.selectedAddons })} style={{ border: '1px solid var(--border)', background: 'none', padding: '2px', borderRadius: '4px' }}><Plus size={14} /></button>
                                    <button onClick={() => deleteFromCart(item.cartItemId)} style={{ marginLeft: '5px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="btn-primary" onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} style={{ width: '100%', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 800 }}>Proceed to Checkout</button>
                </div>
            )}
        </div>
    );
};

export default Home;
