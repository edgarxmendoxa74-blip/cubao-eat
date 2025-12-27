import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    LayoutDashboard,
    LogOut,
    Save,
    Plus,
    Trash2,
    Edit2,
    Package,
    Tag,
    Settings,
    ChevronDown,
    ChevronUp,
    Image as ImageIcon,
    X,
    List,
    CreditCard,
    ShoppingBag,
    Copy,
    Clock,
    MapPin,
    Phone,
    Printer,
    FileText,
    Camera
} from 'lucide-react';
import { categories as initialCategories, menuItems as initialItems } from '../data/MenuData';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('menu'); // menu, categories, orders, payment, orderTypes
    const [message, setMessage] = useState('');

    // --- STATE MANAGEMENT ---
    const [items, setItems] = useState(() => {
        const saved = localStorage.getItem('menuItems');
        return saved ? JSON.parse(saved) : initialItems;
    });

    const [categories, setCategories] = useState(() => {
        const saved = localStorage.getItem('categories');
        return saved ? JSON.parse(saved) : initialCategories;
    });

    const [orders, setOrders] = useState(() => {
        const saved = localStorage.getItem('orders');
        return saved ? JSON.parse(saved) : [];
    });

    const [orderTypes, setOrderTypes] = useState(() => {
        const saved = localStorage.getItem('orderTypes');
        return saved ? JSON.parse(saved) : [
            { id: 'dine-in', name: 'Dine-in' },
            { id: 'pickup', name: 'Pickup' },
            { id: 'delivery', name: 'Delivery' }
        ];
    });

    const [paymentSettings, setPaymentSettings] = useState(() => {
        const saved = localStorage.getItem('paymentSettings');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) {
                // Migration for existing users
                return [
                    { id: 'gcash', name: 'GCash', accountNumber: parsed.gcash?.number || '', accountName: parsed.gcash?.name || '', qrUrl: parsed.gcash?.qrUrl || '' },
                    { id: 'paymaya', name: 'PayMaya', accountNumber: parsed.paymaya?.number || '', accountName: parsed.paymaya?.name || '', qrUrl: parsed.paymaya?.qrUrl || '' }
                ];
            }
            return parsed;
        }
        return [
            { id: 'gcash', name: 'GCash', accountNumber: '', accountName: '', qrUrl: '' },
            { id: 'paymaya', name: 'PayMaya', accountNumber: '', accountName: '', qrUrl: '' }
        ];
    });

    const [storeSettings, setStoreSettings] = useState(() => {
        const saved = localStorage.getItem('storeSettings');
        return saved ? JSON.parse(saved) : {
            manual_status: 'auto', // auto, open, closed
            open_time: '16:00',
            close_time: '01:00',
            store_name: 'Oesters Cafe and Resto',
            address: 'Poblacion, El Nido, Palawan',
            contact: '09563713967',
            logo_url: '',
            banner_images: [
                'https://images.unsplash.com/photo-1517701604599-bb29b565094d?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80'
            ]
        };
    });

    // --- FETCH DATA FROM SUPABASE ---
    useEffect(() => {
        const fetchAdminData = async () => {
            const { data: catData } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
            if (catData) setCategories(catData);

            const { data: itemData } = await supabase.from('menu_items').select('*').order('sort_order', { ascending: true });
            if (itemData) setItems(itemData);

            const { data: payData } = await supabase.from('payment_settings').select('*');
            if (payData) setPaymentSettings(payData);

            const { data: typeData } = await supabase.from('order_types').select('*');
            if (typeData) setOrderTypes(typeData);

            const { data: storeData } = await supabase.from('store_settings').select('*').limit(1).single();
            if (storeData) setStoreSettings(storeData);

            const { data: orderData } = await supabase.from('orders').select('*').order('timestamp', { ascending: false });
            if (orderData) setOrders(orderData);
        };
        fetchAdminData();
    }, []);

    // --- HELPERS ---

    // --- HELPER FUNC ---
    const handleFileUpload = async (e, methodId) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const qrUrl = reader.result;
                const { error } = await supabase.from('payment_settings').update({ qr_url: qrUrl }).eq('id', methodId);
                if (error) { console.error(error); showMessage('Error saving QR code to cloud.'); return; }
                setPaymentSettings(prev => prev.map(m => m.id === methodId ? { ...m, qrUrl } : m));
                showMessage('QR code updated!');
            };
            reader.readAsDataURL(file);
        }
    };

    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_bypass');
        navigate('/admin');
    };

    // --- COMPONENT: MENU MANAGER ---
    const MenuManager = () => {
        const [editingItem, setEditingItem] = useState(null);
        const [searchTerm, setSearchTerm] = useState('');
        const [filterCategory, setFilterCategory] = useState('all');
        const [tempVariations, setTempVariations] = useState([]);
        const [tempFlavors, setTempFlavors] = useState([]);
        const [tempAddons, setTempAddons] = useState([]);

        useEffect(() => {
            if (editingItem) {
                setTempVariations(editingItem.variations || []);
                setTempFlavors(editingItem.flavors || []);
                setTempAddons(editingItem.addons || []);
            }
        }, [editingItem]);

        const handleSubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const itemData = {
                name: formData.get('name'),
                description: formData.get('description'),
                price: Number(formData.get('price')),
                promo_price: formData.get('promoPrice') ? Number(formData.get('promoPrice')) : null,
                category_id: formData.get('categoryId'),
                image: formData.get('image') || 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=500&q=80',
                variations: tempVariations,
                flavors: tempFlavors,
                addons: tempAddons,
                out_of_stock: formData.get('outOfStock') === 'on'
            };

            let finalItem;
            if (editingItem.id === 'new') {
                const { data, error } = await supabase.from('menu_items').insert([itemData]).select().single();
                if (error) { console.error(error); showMessage('Error saving to cloud.'); return; }
                finalItem = data;
                setItems([...items, finalItem]);
            } else {
                const { data, error } = await supabase.from('menu_items').update(itemData).eq('id', editingItem.id).select().single();
                if (error) { console.error(error); showMessage('Error updating cloud.'); return; }
                finalItem = data;
                setItems(items.map(i => i.id === finalItem.id ? finalItem : i));
            }

            setEditingItem(null);
            showMessage('Product saved successfully!');
        };

        const deleteItem = async (id) => {
            if (window.confirm('Delete this product?')) {
                const { error } = await supabase.from('menu_items').delete().eq('id', id);
                if (error) { console.error(error); showMessage('Error deleting from cloud.'); return; }
                setItems(items.filter(i => i.id !== id));
                showMessage('Product deleted.');
            }
        };

        const moveItem = async (id, direction) => {
            const index = items.findIndex(i => i.id === id);
            if (index === -1) return;
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= items.length) return;

            const newItems = [...items];
            const [removed] = newItems.splice(index, 1);
            newItems.splice(newIndex, 0, removed);

            // Re-index all items to ensure consistent sort_order
            const updatedItems = newItems.map((item, idx) => ({ ...item, sort_order: idx }));
            setItems(updatedItems);

            // Update Supabase for all items (batch update)
            const { error } = await supabase.from('menu_items').upsert(updatedItems.map(i => ({
                id: i.id,
                sort_order: i.sort_order,
                name: i.name, // Supabase upsert needs required fields or it might fail/create new if ID mismatch
                price: i.price,
                category_id: i.category_id
            })));
            if (error) console.error('Error syncing order:', error);
        };

        const filteredItems = items.filter(item => {
            const matchesSearch = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'all' || item.category_id === filterCategory;
            return matchesSearch && matchesCategory;
        });

        // Render List
        if (!editingItem) return (
            <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Menu Items</h2>
                    <div style={{ display: 'flex', gap: '10px', flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ ...inputStyle, width: '250px' }}
                        />
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            style={{ ...inputStyle, width: '180px' }}
                        >
                            <option value="all">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button onClick={() => setEditingItem({ id: 'new', category_id: categories[0]?.id })} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px' }}>
                            <Plus size={18} /> Add Product
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}><th style={{ padding: '10px' }}>Product</th><th style={{ padding: '10px' }}>Category</th><th style={{ padding: '10px' }}>Price</th><th style={{ padding: '10px' }}>Actions</th></tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No products found matching your criteria.</td></tr>
                            ) : filteredItems.map(item => (
                                <tr key={item.id} style={{ background: '#f8fafc' }}>
                                    <td style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '15px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                        <img src={item.image} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{ padding: '4px 10px', background: '#e2e8f0', borderRadius: '20px', fontSize: '0.8rem' }}>
                                            {categories.find(c => c.id === item.category_id)?.name || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        {item.promo_price ? (
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.8rem' }}>₱{item.price}</span>
                                                <span style={{ color: '#ef4444', fontWeight: 700 }}>₱{item.promo_price}</span>
                                            </div>
                                        ) : <span style={{ fontWeight: 700 }}>₱{item.price}</span>}
                                    </td>
                                    <td style={{ padding: '15px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => moveItem(item.id, 'up')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Move Up"><ChevronUp size={18} /></button>
                                            <button onClick={() => moveItem(item.id, 'down')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Move Down"><ChevronDown size={18} /></button>
                                            <button onClick={() => setEditingItem(item)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)' }} title="Edit"><Edit2 size={18} /></button>
                                            <button onClick={() => deleteItem(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }} title="Delete"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );

        // Render Editor (Simplified for brevity but functional)
        return (
            <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3>{editingItem.id === 'new' ? 'New Product' : 'Edit Product'}</h3>
                    <button onClick={() => setEditingItem(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
                        <input name="name" defaultValue={editingItem.name} placeholder="Product Name" required style={inputStyle} />
                        <textarea name="description" defaultValue={editingItem.description} placeholder="Description" style={inputStyle} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <input name="price" type="number" defaultValue={editingItem.price} placeholder="Price" required style={inputStyle} />
                            <input name="promoPrice" type="number" defaultValue={editingItem.promo_price} placeholder="Promo Price (Optional)" style={inputStyle} />
                        </div>
                        <select name="categoryId" defaultValue={editingItem.category_id} style={inputStyle}>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input name="image" defaultValue={editingItem.image} placeholder="Image URL" style={inputStyle} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input name="outOfStock" type="checkbox" defaultChecked={editingItem.out_of_stock} style={{ width: '20px', height: '20px' }} />
                            <label style={{ fontWeight: 600 }}>Mark as Out of Stock</label>
                        </div>
                    </div>

                    {/* Variations */}
                    <SectionLabel title="Variations" onAdd={() => setTempVariations([...tempVariations, { name: 'Size', price: 0 }])} />
                    {tempVariations.map((v, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                            <input value={v.name} onChange={e => { const n = [...tempVariations]; n[i].name = e.target.value; setTempVariations(n); }} placeholder="Name" style={inputStyle} />
                            <input type="number" value={v.price} onChange={e => { const n = [...tempVariations]; n[i].price = e.target.value; setTempVariations(n); }} placeholder="Price" style={inputStyle} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                                <input type="checkbox" checked={v.disabled} onChange={e => { const n = [...tempVariations]; n[i].disabled = e.target.checked; setTempVariations(n); }} />
                                <label style={{ fontSize: '0.75rem' }}>Disabled</label>
                            </div>
                            <button type="button" onClick={() => setTempVariations(tempVariations.filter((_, idx) => idx !== i))} style={{ color: 'red', border: 'none', background: 'none' }}><X size={18} /></button>
                        </div>
                    ))}

                    {/* Addons */}
                    <SectionLabel title="Add-ons" onAdd={() => setTempAddons([...tempAddons, { name: 'Addon', price: 0 }])} />
                    {tempAddons.map((v, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                            <input value={v.name} onChange={e => { const n = [...tempAddons]; n[i].name = e.target.value; setTempAddons(n); }} placeholder="Name" style={inputStyle} />
                            <input type="number" value={v.price} onChange={e => { const n = [...tempAddons]; n[i].price = e.target.value; setTempAddons(n); }} placeholder="Price" style={inputStyle} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                                <input type="checkbox" checked={v.disabled} onChange={e => { const n = [...tempAddons]; n[i].disabled = e.target.checked; setTempAddons(n); }} />
                                <label style={{ fontSize: '0.75rem' }}>Disabled</label>
                            </div>
                            <button type="button" onClick={() => setTempAddons(tempAddons.filter((_, idx) => idx !== i))} style={{ color: 'red', border: 'none', background: 'none' }}><X size={18} /></button>
                        </div>
                    ))}

                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '20px' }}>Save Product</button>
                </form>
            </div>
        );
    };

    // --- COMPONENT: CATEGORY MANAGER ---
    const CategoryManager = () => {
        const [newCat, setNewCat] = useState('');
        const [editingCatId, setEditingCatId] = useState(null);
        const [editCatName, setEditCatName] = useState('');

        const addCategory = async (e) => {
            e.preventDefault();
            if (!newCat.trim()) return;
            const { data, error } = await supabase.from('categories').insert([{ name: newCat, sort_order: categories.length }]).select().single();
            if (error) { console.error(error); showMessage('Error adding to cloud.'); return; }
            setCategories([...categories, data]);
            setNewCat('');
            showMessage('Category added!');
        };

        const startEdit = (cat) => {
            setEditingCatId(cat.id);
            setEditCatName(cat.name);
        };

        const saveEdit = async (id) => {
            if (!editCatName.trim()) return;
            const { data, error } = await supabase.from('categories').update({ name: editCatName }).eq('id', id).select().single();
            if (error) { console.error(error); showMessage('Error updating cloud.'); return; }
            setCategories(categories.map(c => c.id === id ? data : c));
            setEditingCatId(null);
            showMessage('Category updated!');
        };

        const moveCategory = async (id, direction) => {
            const index = categories.findIndex(c => c.id === id);
            if (index === -1) return;
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= categories.length) return;

            const newCats = [...categories];
            const [removed] = newCats.splice(index, 1);
            newCats.splice(newIndex, 0, removed);

            const updatedCats = newCats.map((cat, idx) => ({ ...cat, sort_order: idx }));
            setCategories(updatedCats);

            const { error } = await supabase.from('categories').upsert(updatedCats.map(c => ({ id: c.id, name: c.name, sort_order: c.sort_order })));
            if (error) console.error('Error syncing order:', error);
        };

        const deleteCategory = async (id) => {
            if (items.some(i => i.category_id === id)) {
                alert('Cannot delete category because it has products.');
                return;
            }
            if (window.confirm('Delete category?')) {
                const { error } = await supabase.from('categories').delete().eq('id', id);
                if (error) { console.error(error); showMessage('Error deleting from cloud.'); return; }
                setCategories(categories.filter(c => c.id !== id));
                showMessage('Category deleted.');
            }
        };

        return (
            <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '24px' }}>
                <h2 style={{ marginBottom: '30px' }}>Categories Management</h2>
                <form onSubmit={addCategory} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                    <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New Category Name (e.g. Desserts)" style={{ ...inputStyle, flex: 1 }} />
                    <button type="submit" className="btn-primary" style={{ padding: '10px 25px' }}>Add Category</button>
                </form>
                <div style={{ display: 'grid', gap: '15px' }}>
                    {categories.map(c => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#f8fafc', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                            {editingCatId === c.id ? (
                                <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                                    <input value={editCatName} onChange={e => setEditCatName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                    <button onClick={() => saveEdit(c.id)} className="btn-primary" style={{ padding: '5px 15px' }}>Save</button>
                                    <button onClick={() => setEditingCatId(null)} style={{ border: '1px solid #cbd5e1', background: 'white', borderRadius: '10px', padding: '5px 15px' }}>Cancel</button>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{c.name}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{items.filter(i => i.category_id === c.id).length} products</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => moveCategory(c.id, 'up')} style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }} title="Move Up"><ChevronUp size={20} /></button>
                                        <button onClick={() => moveCategory(c.id, 'down')} style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }} title="Move Down"><ChevronDown size={20} /></button>
                                        <button onClick={() => startEdit(c)} style={{ color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer' }} title="Edit"><Edit2 size={20} /></button>
                                        <button onClick={() => deleteCategory(c.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }} title="Delete"><Trash2 size={20} /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- COMPONENT: ORDER TYPE MANAGER ---
    const OrderTypeManager = () => {
        const [newType, setNewType] = useState('');
        const [editingId, setEditingId] = useState(null);
        const [editName, setEditName] = useState('');

        const addType = async (e) => {
            e.preventDefault();
            if (!newType.trim()) return;
            const { data, error } = await supabase.from('order_types').insert([{ name: newType }]).select().single();
            if (error) { console.error(error); showMessage('Error adding to cloud.'); return; }
            setOrderTypes([...orderTypes, data]);
            setNewType('');
            showMessage('Order type added!');
        };

        const startEdit = (type) => {
            setEditingId(type.id);
            setEditName(type.name);
        };

        const saveEdit = async (id) => {
            if (!editName.trim()) return;
            const { data, error } = await supabase.from('order_types').update({ name: editName }).eq('id', id).select().single();
            if (error) { console.error(error); showMessage('Error updating cloud.'); return; }
            setOrderTypes(orderTypes.map(t => t.id === id ? data : t));
            setEditingId(null);
            showMessage('Order type updated!');
        };

        const deleteType = async (id) => {
            if (window.confirm('Delete order type?')) {
                const { error } = await supabase.from('order_types').delete().eq('id', id);
                if (error) { console.error(error); showMessage('Error deleting from cloud.'); return; }
                setOrderTypes(orderTypes.filter(t => t.id !== id));
                showMessage('Order type deleted.');
            }
        };

        return (
            <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '24px' }}>
                <h2 style={{ marginBottom: '30px' }}>Order Types Management</h2>
                <form onSubmit={addType} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                    <input value={newType} onChange={e => setNewType(e.target.value)} placeholder="e.g. Reservation, Takeout" style={{ ...inputStyle, flex: 1 }} />
                    <button type="submit" className="btn-primary" style={{ padding: '10px 25px' }}>Add Type</button>
                </form>
                <div style={{ display: 'grid', gap: '15px' }}>
                    {orderTypes.map(t => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#f8fafc', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                            {editingId === t.id ? (
                                <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                                    <input value={editName} onChange={e => setEditName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                    <button onClick={() => saveEdit(t.id)} className="btn-primary" style={{ padding: '5px 15px' }}>Save</button>
                                    <button onClick={() => setEditingId(null)} style={{ border: '1px solid #cbd5e1', background: 'white', borderRadius: '10px', padding: '5px 15px' }}>Cancel</button>
                                </div>
                            ) : (
                                <>
                                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{t.name}</span>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <button onClick={() => startEdit(t)} style={{ color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer' }} title="Edit"><Edit2 size={20} /></button>
                                        <button onClick={() => deleteType(t.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }} title="Delete"><Trash2 size={20} /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- COMPONENT: PAYMENT SETTINGS ---
    const PaymentSettings = () => {
        const [editingMethodId, setEditingMethodId] = useState(null);
        const [showAddMethod, setShowAddMethod] = useState(false);

        const handleSaveMethod = async (e, methodId) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updateData = {
                name: formData.get('name'),
                account_number: formData.get('accountNumber'),
                account_name: formData.get('accountName'),
            };
            const { data, error } = await supabase.from('payment_settings').update(updateData).eq('id', methodId).select().single();
            if (error) { console.error(error); showMessage('Error updating cloud.'); return; }
            setPaymentSettings(paymentSettings.map(m => m.id === methodId ? data : m));
            setEditingMethodId(null);
            showMessage('Payment method updated!');
        };

        const handleAddMethod = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newMethod = {
                name: formData.get('name'),
                account_number: formData.get('accountNumber'),
                account_name: formData.get('accountName'),
                qr_url: ''
            };
            const { data, error } = await supabase.from('payment_settings').insert([newMethod]).select().single();
            if (error) { console.error(error); showMessage('Error adding to cloud.'); return; }
            setPaymentSettings([...paymentSettings, data]);
            setShowAddMethod(false);
            showMessage('Payment method added!');
        };

        const deleteMethod = async (id) => {
            if (window.confirm('Delete this payment method?')) {
                const { error } = await supabase.from('payment_settings').delete().eq('id', id);
                if (error) { console.error(error); showMessage('Error deleting from cloud.'); return; }
                setPaymentSettings(paymentSettings.filter(m => m.id !== id));
                showMessage('Payment method deleted.');
            }
        };

        return (
            <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ margin: 0 }}>Payment Methods Management</h2>
                    <button onClick={() => setShowAddMethod(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px' }}>
                        <Plus size={18} /> Add Method
                    </button>
                </div>

                {showAddMethod && (
                    <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '15px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Add New Payment Method</h3>
                            <button onClick={() => setShowAddMethod(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddMethod} style={{ display: 'grid', gap: '15px' }}>
                            <input name="name" placeholder="Method Name (e.g. Bank Transfer, GCash)" required style={inputStyle} />
                            <input name="accountNumber" placeholder="Account Number" required style={inputStyle} />
                            <input name="accountName" placeholder="Account Name" required style={inputStyle} />
                            <button type="submit" className="btn-primary">Save Method</button>
                        </form>
                    </div>
                )}

                <div style={{ display: 'grid', gap: '20px' }}>
                    {paymentSettings.map(method => (
                        <div key={method.id} style={{ background: '#f8fafc', padding: '25px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                            {editingMethodId === method.id ? (
                                <form onSubmit={(e) => handleSaveMethod(e, method.id)} style={{ display: 'grid', gap: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <h3 style={{ margin: 0 }}>Edit {method.name}</h3>
                                        <button type="button" onClick={() => setEditingMethodId(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
                                    </div>
                                    <input name="name" defaultValue={method.name} placeholder="Method Name" required style={inputStyle} />
                                    <input name="accountNumber" defaultValue={method.account_number} placeholder="Account Number" required style={inputStyle} />
                                    <input name="accountName" defaultValue={method.account_name} placeholder="Account Name" required style={inputStyle} />

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>QR Code Image (Optional)</label>
                                        {method.qr_url && <img src={method.qr_url} style={{ width: '100px', height: '100px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #ddd' }} />}
                                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, method.id)} style={inputStyle} />
                                    </div>

                                    <button type="submit" className="btn-primary">Save Changes</button>
                                </form>
                            ) : (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                        <div>
                                            <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {method.name}
                                            </h3>
                                            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{method.account_number}</span>
                                                <button onClick={() => { navigator.clipboard.writeText(method.account_number); showMessage('Number copied!'); }} style={{ border: 'none', background: '#e2e8f0', color: 'var(--primary)', borderRadius: '5px', padding: '5px', cursor: 'pointer' }} title="Copy Number">
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '5px' }}>{method.account_name}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => setEditingMethodId(method.id)} style={{ color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer' }}><Edit2 size={20} /></button>
                                            <button onClick={() => deleteMethod(method.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={20} /></button>
                                        </div>
                                    </div>
                                    {method.qr_url && (
                                        <div style={{ marginTop: '15px' }}>
                                            <img src={method.qr_url} style={{ width: '150px', height: '150px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0' }} alt="QR Code" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- COMPONENT: ORDERS LIST ---
    const OrderHistory = () => {
        const stats = orders.reduce((acc, order) => {
            acc.totalOrders++;
            acc.totalSales += Number(order.total_amount || 0);
            if (order.status === 'Pending' || !order.status) acc.pendingOrders++;
            return acc;
        }, { totalOrders: 0, totalSales: 0, pendingOrders: 0 });

        const updateOrderStatus = async (orderId, newStatus) => {
            const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
            if (error) { console.error(error); showMessage('Error updating status on cloud.'); return; }
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            showMessage('Order status updated!');
        };

        const deleteOrder = async (orderId) => {
            if (window.confirm('Are you sure you want to delete this order?')) {
                const { error } = await supabase.from('orders').delete().eq('id', orderId);
                if (error) { console.error(error); showMessage('Error deleting from cloud.'); return; }
                setOrders(orders.filter(o => o.id !== orderId));
                showMessage('Order deleted.');
            }
        };

        const printReceipt = (order) => {
            const printWindow = window.open('', '_blank', 'width=400,height=600');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Receipt - ${order.id}</title>
                        <style>
                            body { font-family: 'Courier New', Courier, monospace; padding: 10px; width: 57mm; margin: 0; font-size: 11px; line-height: 1.2; color: #000; }
                            .center { text-align: center; }
                            .logo { max-width: 30mm; max-height: 30mm; margin: 0 auto 5px; display: block; object-fit: contain; }
                            .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
                            .item { display: flex; justify-content: space-between; margin-bottom: 3px; }
                            .total { font-weight: bold; font-size: 13px; margin-top: 5px; }
                            @media print { 
                                body { width: 57mm; padding: 0; }
                                @page { margin: 0; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="center">
                            ${storeSettings.logo_url ? `<img src="${storeSettings.logo_url}" class="logo">` : ''}
                            <div style="font-weight:bold; font-size: 14px; text-transform: uppercase;">${storeSettings.store_name}</div>
                            <div style="margin-top: 2px;">${storeSettings.address}</div>
                            <div>Tel: ${storeSettings.contact}</div>
                        </div>
                        <div class="divider"></div>
                        <div>
                            <strong>OR#:</strong> ${order.id.toString().slice(-6).toUpperCase()}<br>
                            <strong>Date:</strong> ${new Date(order.timestamp).toLocaleString()}<br>
                            <strong>Type:</strong> ${(order.order_type || 'Dine-in').toUpperCase()}<br>
                            <strong>Cust:</strong> ${order.customer_details?.name}
                            ${order.customer_details?.tableNumber ? `<br><strong>Table:</strong> ${order.customer_details.tableNumber}` : ''}
                        </div>
                        <div class="divider"></div>
                        <div style="font-weight:bold; margin-bottom: 5px;">ITEMS:</div>
                        ${(order.items || []).map(item => `<div class="item"><span>• ${item}</span></div>`).join('')}
                        <div class="divider"></div>
                        <div class="item total">
                            <span>TOTAL</span>
                            <span>₱${order.total_amount}</span>
                        </div>
                        <div class="divider"></div>
                        <div class="center" style="margin-top: 10px; font-style: italic;">
                            *** THANK YOU! ***<br>
                            Please come again.
                        </div>
                        <script>
                            window.onload = () => {
                                window.print();
                                setTimeout(() => window.close(), 500);
                            };
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        };

        return (
            <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ margin: 0 }}>Orders Management</h2>
                </div>

                {/* Stats Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '15px', border: '1px solid #dbeafe' }}>
                        <div style={{ color: '#1e40af', fontSize: '0.9rem', fontWeight: 600 }}>Total Orders</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e3a8a' }}>{stats.totalOrders}</div>
                    </div>
                    <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '15px', border: '1px solid #dcfce7' }}>
                        <div style={{ color: '#166534', fontSize: '0.9rem', fontWeight: 600 }}>Total Sales</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#14532d' }}>₱{stats.totalSales}</div>
                    </div>
                    <div style={{ background: '#fff7ed', padding: '20px', borderRadius: '15px', border: '1px solid #ffedd5' }}>
                        <div style={{ color: '#9a3412', fontSize: '0.9rem', fontWeight: 600 }}>Pending Orders</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#7c2d12' }}>{stats.pendingOrders}</div>
                    </div>
                </div>

                {orders.length === 0 ? <p className="text-muted">No orders recorded yet.</p> : (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {orders.slice().reverse().map((order, idx) => (
                            <div key={order.id || idx} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                        <span style={{ fontWeight: 800, color: 'var(--primary)', marginRight: '10px' }}>{(order.order_type || 'N/A').toUpperCase()}</span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(order.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <select
                                            value={order.status || 'Pending'}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #cbd5e1',
                                                fontSize: '0.85rem',
                                                outline: 'none',
                                                background: order.status === 'Completed' ? '#dcfce7' : order.status === 'Cancelled' ? '#fee2e2' : '#f8fafc',
                                                color: order.status === 'Completed' ? '#166534' : order.status === 'Cancelled' ? '#991b1b' : 'inherit',
                                                fontWeight: 600
                                            }}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Preparing">Preparing</option>
                                            <option value="Ready">Ready</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                        <button onClick={() => printReceipt(order)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }} title="Print Receipt"><Printer size={18} /></button>
                                        <button onClick={() => deleteOrder(order.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }} title="Delete Order"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '10px', fontSize: '0.95rem' }}>
                                    <strong>{order.customer_details?.name}</strong> • {order.payment_method}
                                    {order.customer_details?.phone && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.customer_details.phone}</div>}
                                    {order.customer_details?.tableNumber && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Table: {order.customer_details.tableNumber}</div>}
                                    {order.customer_details?.address && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Address: {order.customer_details.address}</div>}
                                </div>
                                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', fontSize: '0.9rem' }}>
                                    {order.items.map((item, i) => (
                                        <div key={i} style={{ marginBottom: '4px' }}>• {item}</div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '15px', textAlign: 'right', fontWeight: 800, fontSize: '1.1rem' }}>
                                    Total Amount: ₱{order.total_amount}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // --- COMPONENT: STORE GENERAL SETTINGS ---
    const StoreGeneralSettings = () => {
        const handleSave = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updateData = {
                store_name: formData.get('storeName'),
                address: formData.get('address'),
                contact: formData.get('contact'),
                open_time: formData.get('openTime'),
                close_time: formData.get('closeTime'),
                manual_status: formData.get('manualStatus')
            };

            const { data, error } = await supabase.from('store_settings').upsert({ id: storeSettings.id, ...updateData }).select().single();
            if (error) { console.error(error); showMessage('Error saving to cloud.'); return; }
            setStoreSettings(data);
            showMessage('General settings saved!');
        };

        const handleBannerUpload = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const newBanners = [...(storeSettings.banner_images || []), reader.result];
                    const { error } = await supabase.from('store_settings').update({ banner_images: newBanners }).eq('id', storeSettings.id);
                    if (error) { console.error(error); showMessage('Error saving banner to cloud.'); return; }
                    setStoreSettings({ ...storeSettings, banner_images: newBanners });
                    showMessage('Banner uploaded!');
                };
                reader.readAsDataURL(file);
            }
        };

        const removeBanner = async (index) => {
            const newBanners = (storeSettings.banner_images || []).filter((_, i) => i !== index);
            const { error } = await supabase.from('store_settings').update({ banner_images: newBanners }).eq('id', storeSettings.id);
            if (error) { console.error(error); showMessage('Error removing from cloud.'); return; }
            setStoreSettings({ ...storeSettings, banner_images: newBanners });
            showMessage('Banner removed.');
        };

        const handleLogoUpload = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const logoUrl = reader.result;
                    const { error } = await supabase.from('store_settings').update({ logo_url: logoUrl }).eq('id', storeSettings.id);
                    if (error) { console.error(error); showMessage('Error saving logo to cloud.'); return; }
                    setStoreSettings({ ...storeSettings, logo_url: logoUrl });
                    showMessage('Logo updated!');
                };
                reader.readAsDataURL(file);
            }
        };

        return (
            <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '24px' }}>
                <h2 style={{ marginBottom: '30px' }}>Store Settings</h2>

                <form onSubmit={handleSave}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Clock size={20} /> Store Availability
                            </h3>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>Manual Status Toggle</label>
                                    <select name="manualStatus" defaultValue={storeSettings.manual_status} style={inputStyle}>
                                        <option value="auto">Auto (Based on Hours)</option>
                                        <option value="open">Always Open</option>
                                        <option value="closed">Always Closed</option>
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>Opening Time</label>
                                        <input name="openTime" type="time" defaultValue={storeSettings.open_time} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>Closing Time</label>
                                        <input name="closeTime" type="time" defaultValue={storeSettings.close_time} style={inputStyle} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FileText size={20} /> Store Information
                            </h3>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <div><label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>Store Name</label><input name="storeName" defaultValue={storeSettings.store_name} style={inputStyle} /></div>
                                <div><label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>Address</label><input name="address" defaultValue={storeSettings.address} style={inputStyle} /></div>
                                <div><label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>Contact Number</label><input name="contact" defaultValue={storeSettings.contact} style={inputStyle} /></div>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Camera size={20} /> Store Logo
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {storeSettings.logo_url && <img src={storeSettings.logo_url} style={{ width: '120px', height: '120px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '10px' }} />}
                                <input type="file" accept="image/*" onChange={handleLogoUpload} style={inputStyle} />
                            </div>
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <ImageIcon size={20} /> Hero Slideshow Banners
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                {(storeSettings.banner_images || []).map((url, i) => (
                                    <div key={i} style={{ position: 'relative' }}>
                                        <img src={url} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '12px' }} alt={`Banner ${i}`} />
                                        <button type="button" onClick={() => removeBanner(i)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                                    </div>
                                ))}
                                <label style={{ height: '120px', border: '2px dashed #cbd5e1', borderRadius: '12px', background: '#f8fafc', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                    <Plus size={24} />
                                    <span style={{ fontSize: '0.8rem' }}>Upload Image</span>
                                    <input type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: 'none' }} />
                                </label>
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: '40px', width: '100%', padding: '15px' }}>Save All Settings</button>
                </form>
            </div>
        );
    };


    // --- MAIN RENDER ---
    return (
        <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Inter' }}>
            {/* Sidebar */}
            <aside style={{ width: '260px', background: 'var(--primary)', color: 'white', padding: '30px 20px', position: 'fixed', height: '100vh' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '50px', paddingLeft: '10px' }}>
                    <Package size={28} color="var(--accent)" />
                    <span style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Playfair Display' }}>Oesters</span>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <SidebarItem icon={<List size={20} />} label="Menu Items" active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
                    <SidebarItem icon={<Tag size={20} />} label="Categories" active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} />
                    <SidebarItem icon={<ShoppingBag size={20} />} label="Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                    <SidebarItem icon={<Settings size={20} />} label="Order Types" active={activeTab === 'orderTypes'} onClick={() => setActiveTab('orderTypes')} />
                    <SidebarItem icon={<CreditCard size={20} />} label="Payment Methods" active={activeTab === 'payment'} onClick={() => setActiveTab('payment')} />
                    <SidebarItem icon={<LayoutDashboard size={20} />} label="General Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                </nav>

                <button onClick={handleLogout} style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '12px', width: '100%', borderRadius: '10px', cursor: 'pointer', position: 'absolute', bottom: '30px', left: '20px', width: 'calc(100% - 40px)' }}>
                    <LogOut size={20} /> Sign Out
                </button>
            </aside>

            {/* Main Content */}
            <main style={{ marginLeft: '260px', flex: 1, padding: '40px', maxWidth: '1200px' }}>
                {message && <div style={{ background: '#dcfce7', color: '#166534', padding: '15px', borderRadius: '12px', marginBottom: '30px', textAlign: 'center' }}>{message}</div>}

                {activeTab === 'menu' && <MenuManager />}
                {activeTab === 'categories' && <CategoryManager />}
                {activeTab === 'orders' && <OrderHistory />}
                {activeTab === 'orderTypes' && <OrderTypeManager />}
                {activeTab === 'payment' && <PaymentSettings />}
                {activeTab === 'settings' && <StoreGeneralSettings />}
            </main>
        </div>
    );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px',
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
        border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600,
        textAlign: 'left', width: '100%', transition: 'all 0.2s'
    }}>
        {icon} {label}
    </button>
);

const SectionLabel = ({ title, onAdd }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '10px', paddingBottom: '5px', borderBottom: '1px solid #eee' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{title}</label>
        <button type="button" onClick={onAdd} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>+ Add</button>
    </div>
);

const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem' };

export default AdminDashboard;
