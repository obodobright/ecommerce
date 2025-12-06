const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306
};

const dbName = process.env.DB_NAME || 'ecommerce_db';

async function initDatabase() {
    let connection;
    
    try {
        // Connect to MySQL server (without database)
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL server');

        // Create database if it doesn't exist
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`✅ Database '${dbName}' ready`);

        // Close the connection and reconnect WITH the database selected
        await connection.end();
        
        // Reconnect with database specified
        connection = await mysql.createConnection({
            ...dbConfig,
            database: dbName
        });
        console.log(`✅ Connected to database '${dbName}'`);

        // Create users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                address TEXT,
                password VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table created');

        // Create products table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                stock INT DEFAULT 0,
                image VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Products table created');

        // Create cart table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS cart (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                UNIQUE KEY unique_cart_item (user_id, product_id)
            )
        `);
        console.log('✅ Cart table created');

        // Create orders table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                shipping_name VARCHAR(255) NOT NULL,
                shipping_email VARCHAR(255) NOT NULL,
                shipping_phone VARCHAR(20) NOT NULL,
                shipping_address TEXT NOT NULL,
                shipping_city VARCHAR(100) NOT NULL,
                shipping_state VARCHAR(100) NOT NULL,
                shipping_zip VARCHAR(20) NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                subtotal DECIMAL(10, 2) NOT NULL,
                tax DECIMAL(10, 2) NOT NULL,
                total DECIMAL(10, 2) NOT NULL,
                status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Orders table created');

        // Create order_items table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `);
        console.log('✅ Order items table created');

        // Insert default admin user
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const [existingAdmin] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            ['admin@store.com']
        );

        if (existingAdmin.length === 0) {
            await connection.execute(
                'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Admin User', 'admin@store.com', hashedPassword, 'admin']
            );
            console.log('✅ Default admin user created (admin@store.com / admin123)');
        }

        // Insert sample products
        const [existingProducts] = await connection.execute('SELECT COUNT(*) as count FROM products');
        
        if (existingProducts[0].count === 0) {
            const sampleProducts = [
                ['Men’s Classic Tee', 'mens', 'Soft cotton classic-fit t-shirt for men', 19.99, 120, 'https://source.unsplash.com/featured/?mens-shirt'],
                ['Men’s Denim Jeans', 'mens', 'Comfortable straight-cut blue jeans', 49.99, 80, 'https://source.unsplash.com/featured/?mens-jeans'],
                ['Men’s Hoodie', 'mens', 'Warm fleece-lined hoodie', 39.99, 50, 'https://ik.imagekit.io/hydekcjmz/phiyorbyte/Rectangle%2089.png?updatedAt=1723262511724'],
                ['Men’s Chinos', 'mens', 'Slim fit chinos suitable for casual wear', 34.99, 60, 'https://ik.imagekit.io/hydekcjmz/phiyorbyte/Rectangle%2088.png?updatedAt=1723262452521'],
                ['Women’s Summer Dress', 'womens', 'Lightweight floral dress perfect for summer', 29.99, 100, 'https://ik.imagekit.io/hydekcjmz/phiyorbyte/nikhil-uttam-gMkpcMPno-w-unsplash.jpg?updatedAt=1742375536512'],
                ['Women’s Handbag', 'womens', 'Elegant leather handbag for everyday use', 59.99, 40, 'https://ik.imagekit.io/hydekcjmz/phiyorbyte/Rectangle%2090.png?updatedAt=1723262450365'],
                ['Women’s Jeans', 'womens', 'High-waist skinny fit jeans', 44.99, 70, 'https://ik.imagekit.io/hydekcjmz/phiyorbyte/samantha-gades-JeEemtLSdjU-unsplash.jpg?updatedAt=1742375465607'],
                ['Women’s Blouse', 'womens', 'Soft long-sleeve blouse with modern styling', 24.99, 90, 'https://ik.imagekit.io/hydekcjmz/phiyorbyte/mariabeatrice-alonzi-VyI0GBHSsJ8-unsplash.jpg?updatedAt=1742375421564'],
                ['Kids Graphic Tee', 'kids', 'Fun printed t-shirt for kids', 14.99, 150, 'https://ik.imagekit.io/hydekcjmz/phiyorbyte/henry-co-cp-VMJ-mdKs-unsplash.jpg?updatedAt=1742375535836'],
                ['Kids Hoodie', 'kids', 'Warm and comfortable hoodie for children', 24.99, 100, 'https://source.unsplash.com/featured/?kids-hoodie'],
                ['Kids Sneakers', 'kids', 'Durable sneakers designed for kids', 34.99, 85, 'https://ik.imagekit.io/hydekcjmz/phiyorbyte/Rectangle%2087.png?updatedAt=1723262452314'],
                ['Kids Shorts', 'kids', 'Breathable cotton shorts', 12.99, 130, 'https://source.unsplash.com/featured/?kids-shorts'],
                ['Running Shoes', 'footwear', 'Lightweight running shoes with great cushioning', 59.99, 75, 'https://ik.imagekit.io/hydekcjmz/phiyorbyte/Rectangle%2091.png?updatedAt=1723262450553'],
                ['Casual Sneakers', 'footwear', 'Stylish sneakers for everyday wear', 49.99, 90, 'https://ik.imagekit.io/hydekcjmz/phiyorbyte/Rectangle%2091.png?updatedAt=1723262450553'],
                ['Leather Boots', 'footwear', 'Durable leather boots for outdoor use', 89.99, 35, 'https://ik.imagekit.io/hydekcjmz/phiyorbyte/henry-co-cp-VMJ-mdKs-unsplash.jpg?updatedAt=1742375535836'],
                ['Sandals', 'footwear', 'Comfortable open-toe sandals', 19.99, 110, 'https://source.unsplash.com/featured/?sandals'],
                ['Baseball Cap', 'accessories', 'Adjustable cap with breathable material', 9.99, 200, 'https://source.unsplash.com/featured/?cap'],
                ['Leather Belt', 'accessories', 'Classic leather belt for men and women', 14.99, 120, 'https://source.unsplash.com/featured/?belt'],
                ['Sunglasses', 'accessories', 'UV-protected stylish sunglasses', 19.99, 150, 'https://source.unsplash.com/featured/?sunglasses'],
                ['Wristwatch', 'accessories', 'Minimalist wristwatch with leather band', 39.99, 70, 'https://source.unsplash.com/featured/?watch']
            ];

            for (const product of sampleProducts) {
                await connection.execute(
                    'INSERT INTO products (name, category, description, price, stock, image) VALUES (?, ?, ?, ?, ?, ?)',
                    product
                );
            }
            console.log('✅ Sample products inserted');
        }

        console.log('\n🎉 Database initialization completed successfully!');
        console.log('\n📝 Default Admin Credentials:');
        console.log('   Email: admin@store.com');
        console.log('   Password: admin123\n');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

initDatabase();