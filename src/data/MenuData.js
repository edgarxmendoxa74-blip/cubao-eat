export const categories = [
    { id: 'packed-meals', name: 'Packed Meals', sort_order: 1 },
    { id: 'party-trays', name: 'Party Trays', sort_order: 2 },
    { id: 'special-rice', name: 'Special Fried Rice', sort_order: 3 },
    { id: 'desserts', name: 'Desserts', sort_order: 4 },
];

export const menuItems = [
    // Packed Meals
    {
        id: 1,
        categoryId: 'packed-meals',
        name: 'Classic Chicken Inasal Meal',
        description: 'Grilled chicken inasal served with rice and atchara.',
        price: 150,
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
    },
    {
        id: 2,
        categoryId: 'packed-meals',
        name: 'Pork Liempo Meal',
        description: 'Grilled pork belly served with rice.',
        price: 165,
        image: 'https://images.unsplash.com/photo-1544124499-58ec5067425f?auto=format&fit=crop&w=400&q=80',
    },
    // Party Trays
    {
        id: 3,
        categoryId: 'party-trays',
        name: 'Pancit Guisado (Party Tray)',
        description: 'Traditional Filipino stir-fried noodles, good for 8-10 persons.',
        price: 850,
        image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=80',
    },
    {
        id: 4,
        categoryId: 'party-trays',
        name: 'Lumpiang Shanghai (Tray)',
        description: 'Crispy pork spring rolls, 50 pieces per tray.',
        price: 750,
        image: 'https://images.unsplash.com/photo-1623938986311-73bc3a99e9c7?auto=format&fit=crop&w=400&q=80',
    },
    // Special Fried Rice
    {
        id: 5,
        categoryId: 'special-rice',
        name: 'Fiesta Special Fried Rice',
        description: 'Loaded with mixed vegetables, shrimp, and meat toppings.',
        price: 180,
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=80',
        variations: [
            { name: 'Regular', price: 180 },
            { name: 'Family Size', price: 320 }
        ]
    }
];
