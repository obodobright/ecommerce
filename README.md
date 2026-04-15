# Ecommerce System - Full Stack Application

A complete ecommerce system with Node.js backend and MySQL database, featuring user and admin
modules.

## Features

### User Module

- User registration and authentication
- Browse products by category
- Filter products
- Shopping cart management
- Checkout process
- Order confirmation

### Admin Module

- Admin authentication
- Dashboard with statistics
- Product management (CRUD)
- Order management
- Stock and pricing updates

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## Installation

1. **Clone the repository**

   ```bash
   cd ecommerce-assignment
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update database credentials in `.env`:
     ```
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=your_password
     DB_NAME=ecommerce_db
     DB_PORT=3306
     JWT_SECRET=your_secret_key_here
     PORT=3000
     ```

4. **Initialize the database**

   ```bash
   npm run init-db
   ```

   This will:
   - Create the database if it doesn't exist
   - Create all necessary tables
   - Insert sample products
   - Create default admin user

5. **Start the server**

   ```bash
   npm start
   ```

   For development with auto-reload:

   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000/index.html
   - API: http://localhost:3000/api

## Default Admin Credentials

- **Email**: admin@store.com
- **Password**: admin123

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires auth)

### Products

- `GET /api/products` - Get all products (with optional filters: category, search, sortBy)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Cart

- `GET /api/cart` - Get user's cart (requires auth)
- `POST /api/cart/add` - Add item to cart (requires auth)
- `PUT /api/cart/:id` - Update cart item quantity (requires auth)
- `DELETE /api/cart/:id` - Remove item from cart (requires auth)
- `DELETE /api/cart` - Clear cart (requires auth)

### Orders

- `GET /api/orders` - Get user's orders (requires auth)
- `GET /api/orders/:id` - Get single order (requires auth)
- `POST /api/orders` - Create new order (requires auth)

### Admin

- `GET /api/admin/dashboard` - Get dashboard statistics (admin only)
- `GET /api/admin/orders` - Get all orders (admin only)
- `GET /api/admin/orders/:id` - Get single order (admin only)
- `PUT /api/admin/orders/:id/status` - Update order status (admin only)

## Database Schema

### Tables

- `users` - User accounts
- `products` - Product catalog
- `cart` - Shopping cart items
- `orders` - Order information
- `order_items` - Order line items

## Project Structure

```
ecommerce-assignment/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── products.js          # Product routes
│   ├── cart.js              # Cart routes
│   ├── orders.js            # Order routes
│   └── admin.js             # Admin routes
├── scripts/
│   └── initDatabase.js      # Database initialization
├── css/
│   └── style.css            # Custom styles
├── js/
│   ├── api.js               # API client
│   └── main.js              # Utility functions
├── user/                    # User module pages
├── admin/                   # Admin module pages
├── server.js                # Express server
├── package.json             # Dependencies
└── README.md                # This file
```

## Development

The application uses:

- **Express.js** for the REST API
- **MySQL2** with connection pooling
- **JWT** for stateless authentication
- **bcryptjs** for password hashing
- **CORS** enabled for frontend-backend communication

## Notes

- All API requests (except register/login) require JWT authentication
- Admin routes require both authentication and admin role
- Cart and orders are user-specific
- Product stock is automatically updated when orders are placed
- The frontend uses localStorage to store auth token and user info

## Troubleshooting

1. **Database connection error**: Check MySQL is running and credentials in `.env` are correct
2. **Port already in use**: Change `PORT` in `.env` or stop the process using port 3000
3. **CORS errors**: Ensure the frontend is being served from the same origin or update CORS settings
4. **Authentication errors**: Check JWT_SECRET is set in `.env`

## License

ISC

USE DOCKER
