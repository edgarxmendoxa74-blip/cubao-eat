# Fiesta Kainan sa Cubao

A premium web application for Fiesta Kainan sa Cubao, specializing in authentic Filipino dining and a vibrant community experience.

## Features
- **Dynamic Menu**: Real-time menu management with categories, variations, and add-ons.
- **Store Status**: Automatic and manual toggle for store opening/closing hours.
- **Order Management**: Checkout integration with Facebook Messenger for seamless ordering.
- **Admin Dashboard**: Full CRUD for menu items and categories, order history, and store settings.
- **Thermal Printing**: Built-in support for 57mm thermal receipts.
- **Responsive Design**: Fully optimized for mobile and desktop views.

## Tech Stack
- **Frontend**: React (Vite)
- **Database/Backend**: Supabase (Schema provided in `supabase_schema.sql`)
- **Icons**: Lucide React
- **Styling**: Vanilla CSS with modern aesthetics

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Locally:**
   ```bash
   npm run dev
   ```

3. **Database Setup:**
   - Create a project in Supabase.
   - Run the contents of `supabase_schema.sql` in the SQL Editor to set up the tables.

4. **Admin Access:**
   - Navigate to `/login` to access the administrative dashboard.
   - Manage store settings, hours, and menu items directly from the panel.

## Credits
Built with passion for quality in every bite.
