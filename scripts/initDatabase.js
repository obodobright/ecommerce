const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: "127.0.0.1",
  user: "root",
  password: "root",
  port: 3307,
  database: "myapp",
};

const dbName = process.env.DB_NAME || "ecommerce_db";

async function initDatabase() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to MySQL server");

    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' ready`);

    await connection.end();

    connection = await mysql.createConnection({
      ...dbConfig,
      database: dbName,
    });
    console.log(`✅ Connected to database '${dbName}'`);

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
    console.log("✅ Users table created");

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
    console.log("✅ Products table created");

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
    console.log("✅ Cart table created");

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
    console.log("✅ Orders table created");

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
    console.log("✅ Order items table created");

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const [existingAdmin] = await connection.execute("SELECT id FROM users WHERE email = ?", [
      "admin@store.com",
    ]);

    if (existingAdmin.length === 0) {
      await connection.execute(
        "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)",
        ["Admin User", "admin@store.com", hashedPassword, "admin"],
      );
      console.log("✅ Default admin user created (admin@store.com / admin123)");
    }

    const [existingProducts] = await connection.execute("SELECT COUNT(*) as count FROM products");

    if (existingProducts[0].count === 0) {
      const sampleProducts = [
        // MEN'S CLOTHING (25 products)
        [
          "Classic Crew Neck T-Shirt",
          "mens",
          "Premium cotton t-shirt with classic crew neckline",
          24.99,
          150,
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
        ],
        [
          "V-Neck Basic Tee",
          "mens",
          "Comfortable v-neck t-shirt perfect for layering",
          22.99,
          140,
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop",
        ],
        [
          "Striped Polo Shirt",
          "mens",
          "Classic striped polo with collar",
          34.99,
          100,
          "https://images.unsplash.com/photo-1578153156851-8a9f85e7e039?w=500&h=500&fit=crop",
        ],
        [
          "Oxford Button-Up Shirt",
          "mens",
          "Crisp oxford cloth button-down shirt",
          44.99,
          80,
          "https://images.unsplash.com/photo-1596194281784-c91aa8ac49c3?w=500&h=500&fit=crop",
        ],
        [
          "Casual Long Sleeve Henley",
          "mens",
          "Soft long-sleeve henley with button placket",
          32.99,
          90,
          "https://images.unsplash.com/photo-1528763732619-57b0b4a96529?w=500&h=500&fit=crop",
        ],
        [
          "Classic Blue Denim Jeans",
          "mens",
          "Timeless straight-fit denim",
          54.99,
          120,
          "https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500&h=500&fit=crop",
        ],
        [
          "Slim Fit Black Jeans",
          "mens",
          "Modern slim-fit black jeans",
          59.99,
          110,
          "https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500&h=500&fit=crop",
        ],
        [
          "Distressed Ripped Jeans",
          "mens",
          "Trendy distressed ripped jeans",
          49.99,
          70,
          "https://images.unsplash.com/photo-1534521b229d8f7c4c0c0d2e8c3f3f3f?w=500&h=500&fit=crop",
        ],
        [
          "Cargo Pants Olive",
          "mens",
          "Durable cargo pants with multiple pockets",
          52.99,
          85,
          "https://images.unsplash.com/photo-1473062348122-7cda3e28b5db?w=500&h=500&fit=crop",
        ],
        [
          "Classic Chinos Khaki",
          "mens",
          "Versatile khaki chinos for any occasion",
          39.99,
          100,
          "https://images.unsplash.com/photo-1473062348122-7cda3e28b5db?w=500&h=500&fit=crop",
        ],
        [
          "Athletic Fleece Hoodie",
          "mens",
          "Warm fleece-lined pullover hoodie",
          49.99,
          95,
          "https://images.unsplash.com/photo-1556821552-cb06b4700f68?w=500&h=500&fit=crop",
        ],
        [
          "Zip-Up Hoodie Gray",
          "mens",
          "Comfortable zip-up hoodie in heather gray",
          52.99,
          85,
          "https://images.unsplash.com/photo-1556821552-cb06b4700f68?w=500&h=500&fit=crop",
        ],
        [
          "Crewneck Sweatshirt",
          "mens",
          "Classic crewneck sweatshirt",
          44.99,
          100,
          "https://images.unsplash.com/photo-1556821552-cb06b4700f68?w=500&h=500&fit=crop",
        ],
        [
          "Lightweight Bomber Jacket",
          "mens",
          "Sleek bomber jacket for layering",
          89.99,
          60,
          "https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500&h=500&fit=crop",
        ],
        [
          "Casual Denim Jacket",
          "mens",
          "Classic blue denim jacket",
          74.99,
          75,
          "https://images.unsplash.com/photo-1551555603-7ddb5b5a9d7f?w=500&h=500&fit=crop",
        ],
        [
          "Wool Blend Cardigan",
          "mens",
          "Warm wool blend cardigan sweater",
          64.99,
          50,
          "https://images.unsplash.com/photo-1551555603-7ddb5b5a9d7f?w=500&h=500&fit=crop",
        ],
        [
          "V-Neck Pullover Sweater",
          "mens",
          "Elegant v-neck pullover",
          54.99,
          70,
          "https://images.unsplash.com/photo-1556821552-cb06b4700f68?w=500&h=500&fit=crop",
        ],
        [
          "Crew Neck Cable Knit",
          "mens",
          "Textured cable knit sweater",
          59.99,
          65,
          "https://images.unsplash.com/photo-1556821552-cb06b4700f68?w=500&h=500&fit=crop",
        ],
        [
          "Athletic Shorts Black",
          "mens",
          "Comfortable athletic shorts with liner",
          29.99,
          120,
          "https://images.unsplash.com/photo-1506629082632-eca07ce68f77?w=500&h=500&fit=crop",
        ],
        [
          "Swim Trunks Blue",
          "mens",
          "Quick-dry swim trunks",
          34.99,
          100,
          "https://images.unsplash.com/photo-1506629082632-eca07ce68f77?w=500&h=500&fit=crop",
        ],
        [
          "Casual Linen Shorts",
          "mens",
          "Breathable linen shorts",
          39.99,
          90,
          "https://images.unsplash.com/photo-1506629082632-eca07ce68f77?w=500&h=500&fit=crop",
        ],
        [
          "Performance Tank Top",
          "mens",
          "Moisture-wicking tank top",
          19.99,
          150,
          "https://images.unsplash.com/photo-1506629082632-eca07ce68f77?w=500&h=500&fit=crop",
        ],
        [
          "Thermal Base Layer",
          "mens",
          "Warm thermal undershirt",
          32.99,
          80,
          "https://images.unsplash.com/photo-1556821552-cb06b4700f68?w=500&h=500&fit=crop",
        ],
        [
          "Compression Shirt",
          "mens",
          "Compression wear for support",
          44.99,
          70,
          "https://images.unsplash.com/photo-1506629082632-eca07ce68f77?w=500&h=500&fit=crop",
        ],
        [
          "Graphic Print Tee",
          "mens",
          "Bold graphic print t-shirt",
          28.99,
          110,
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
        ],

        // WOMEN'S CLOTHING (25 products)
        [
          "Classic White Tank Top",
          "womens",
          "Essential white tank top",
          19.99,
          180,
          "https://images.unsplash.com/photo-1506139773649-3bde47ce4767?w=500&h=500&fit=crop",
        ],
        [
          "V-Neck T-Shirt",
          "womens",
          "Flattering v-neck tee",
          24.99,
          160,
          "https://images.unsplash.com/photo-1506139773649-3bde47ce4767?w=500&h=500&fit=crop",
        ],
        [
          "Fitted Crew Neck Tee",
          "womens",
          "Fitted crew neck t-shirt",
          22.99,
          150,
          "https://images.unsplash.com/photo-1506139773649-3bde47ce4767?w=500&h=500&fit=crop",
        ],
        [
          "Long Sleeve Crop Top",
          "womens",
          "Trendy long sleeve crop top",
          32.99,
          100,
          "https://images.unsplash.com/photo-1506139773649-3bde47ce4767?w=500&h=500&fit=crop",
        ],
        [
          "Off Shoulder Blouse",
          "womens",
          "Elegant off-shoulder blouse",
          44.99,
          85,
          "https://images.unsplash.com/photo-1595777707802-51b40f1e887b?w=500&h=500&fit=crop",
        ],
        [
          "Button-Up Dress Shirt",
          "womens",
          "Professional button-up shirt",
          49.99,
          75,
          "https://images.unsplash.com/photo-1595777707802-51b40f1e887b?w=500&h=500&fit=crop",
        ],
        [
          "Floral Print Blouse",
          "womens",
          "Beautiful floral patterned blouse",
          39.99,
          90,
          "https://images.unsplash.com/photo-1595777707802-51b40f1e887b?w=500&h=500&fit=crop",
        ],
        [
          "Silk Camisole",
          "womens",
          "Luxurious silk camisole",
          54.99,
          60,
          "https://images.unsplash.com/photo-1595777707802-51b40f1e887b?w=500&h=500&fit=crop",
        ],
        [
          "High-Waist Skinny Jeans",
          "womens",
          "Flattering high-waist jeans",
          59.99,
          110,
          "https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500&h=500&fit=crop",
        ],
        [
          "Bootcut Denim",
          "womens",
          "Classic bootcut jeans",
          54.99,
          100,
          "https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500&h=500&fit=crop",
        ],
        [
          "Straight Leg Jeans",
          "womens",
          "Timeless straight-leg denim",
          52.99,
          105,
          "https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500&h=500&fit=crop",
        ],
        [
          "Distressed Ripped Jeans",
          "womens",
          "Trendy distressed denim",
          54.99,
          85,
          "https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500&h=500&fit=crop",
        ],
        [
          "Faux Leather Leggings",
          "womens",
          "Sleek faux leather leggings",
          44.99,
          100,
          "https://images.unsplash.com/photo-1506629082632-eca07ce68f77?w=500&h=500&fit=crop",
        ],
        [
          "High-Waist Yoga Pants",
          "womens",
          "Comfortable yoga pants",
          49.99,
          120,
          "https://images.unsplash.com/photo-1506629082632-eca07ce68f77?w=500&h=500&fit=crop",
        ],
        [
          "Classic Khaki Chinos",
          "womens",
          "Versatile khaki chinos",
          44.99,
          95,
          "https://images.unsplash.com/photo-1473062348122-7cda3e28b5db?w=500&h=500&fit=crop",
        ],
        [
          "Floral Summer Dress",
          "womens",
          "Light and breezy floral dress",
          49.99,
          100,
          "https://images.unsplash.com/photo-1595777707802-51b40f1e887b?w=500&h=500&fit=crop",
        ],
        [
          "Black Maxi Dress",
          "womens",
          "Elegant black maxi dress",
          69.99,
          75,
          "https://images.unsplash.com/photo-1595777707802-51b40f1e887b?w=500&h=500&fit=crop",
        ],
        [
          "Casual A-Line Dress",
          "womens",
          "Comfortable a-line dress",
          44.99,
          85,
          "https://images.unsplash.com/photo-1595777707802-51b40f1e887b?w=500&h=500&fit=crop",
        ],
        [
          "Pullover Hoodie",
          "womens",
          "Cozy pullover hoodie",
          49.99,
          100,
          "https://images.unsplash.com/photo-1556821552-cb06b4700f68?w=500&h=500&fit=crop",
        ],
        [
          "Zip-Up Sweatshirt",
          "womens",
          "Soft zip-up sweatshirt",
          44.99,
          95,
          "https://images.unsplash.com/photo-1556821552-cb06b4700f68?w=500&h=500&fit=crop",
        ],
        [
          "Cardigan Sweater Cream",
          "womens",
          "Classic cream cardigan",
          59.99,
          80,
          "https://images.unsplash.com/photo-1556821552-cb06b4700f68?w=500&h=500&fit=crop",
        ],
        [
          "Knit Pullover Sweater",
          "womens",
          "Cozy knit pullover",
          54.99,
          85,
          "https://images.unsplash.com/photo-1556821552-cb06b4700f68?w=500&h=500&fit=crop",
        ],
        [
          "Cropped Leather Jacket",
          "womens",
          "Chic cropped leather jacket",
          99.99,
          50,
          "https://images.unsplash.com/photo-1551555603-7ddb5b5a9d7f?w=500&h=500&fit=crop",
        ],
        [
          "Denim Jacket Classic",
          "womens",
          "Timeless denim jacket",
          74.99,
          70,
          "https://images.unsplash.com/photo-1551555603-7ddb5b5a9d7f?w=500&h=500&fit=crop",
        ],
        [
          "Lightweight Blazer",
          "womens",
          "Professional blazer",
          89.99,
          65,
          "https://images.unsplash.com/photo-1551555603-7ddb5b5a9d7f?w=500&h=500&fit=crop",
        ],

        // KIDS CLOTHING (20 products)
        [
          "Kids Cotton T-Shirt",
          "kids",
          "Soft cotton t-shirt for kids",
          16.99,
          200,
          "https://images.unsplash.com/photo-1503342320505-c894ddcb4d4f?w=500&h=500&fit=crop",
        ],
        [
          "Kids Graphic Tee",
          "kids",
          "Fun character graphic t-shirt",
          18.99,
          180,
          "https://images.unsplash.com/photo-1503342320505-c894ddcb4d4f?w=500&h=500&fit=crop",
        ],
        [
          "Kids Long Sleeve Shirt",
          "kids",
          "Comfortable long sleeve shirt",
          19.99,
          160,
          "https://images.unsplash.com/photo-1503342320505-c894ddcb4d4f?w=500&h=500&fit=crop",
        ],
        [
          "Kids Polo Shirt",
          "kids",
          "Classic kids polo shirt",
          22.99,
          150,
          "https://images.unsplash.com/photo-1503342320505-c894ddcb4d4f?w=500&h=500&fit=crop",
        ],
        [
          "Kids Blue Jeans",
          "kids",
          "Durable kids blue jeans",
          29.99,
          140,
          "https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500&h=500&fit=crop",
        ],
        [
          "Kids Black Pants",
          "kids",
          "Classic black pants for kids",
          28.99,
          130,
          "https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500&h=500&fit=crop",
        ],
        [
          "Kids Cargo Shorts",
          "kids",
          "Practical cargo shorts",
          24.99,
          150,
          "https://images.unsplash.com/photo-1506629082632-eca07ce68f77?w=500&h=500&fit=crop",
        ],
        [
          "Kids Swim Shorts",
          "kids",
          "Colorful swim shorts",
          22.99,
          160,
          "https://images.unsplash.com/photo-1506629082632-eca07ce68f77?w=500&h=500&fit=crop",
        ],
        [
          "Kids Pullover Hoodie",
          "kids",
          "Warm pullover hoodie",
          34.99,
          120,
          "https://images.unsplash.com/photo-1556821552-cb06b4700f68?w=500&h=500&fit=crop",
        ],
        [
          "Kids Zip-Up Hoodie",
          "kids",
          "Cozy zip-up hoodie",
          36.99,
          110,
          "https://images.unsplash.com/photo-1556821552-cb06b4700f68?w=500&h=500&fit=crop",
        ],
        [
          "Kids Sweatshirt",
          "kids",
          "Comfortable sweatshirt",
          31.99,
          125,
          "https://images.unsplash.com/photo-1556821552-cb06b4700f68?w=500&h=500&fit=crop",
        ],
        [
          "Kids Denim Jacket",
          "kids",
          "Kid-sized denim jacket",
          54.99,
          80,
          "https://images.unsplash.com/photo-1551555603-7ddb5b5a9d7f?w=500&h=500&fit=crop",
        ],
        [
          "Kids Raincoat",
          "kids",
          "Waterproof raincoat",
          44.99,
          100,
          "https://images.unsplash.com/photo-1551555603-7ddb5b5a9d7f?w=500&h=500&fit=crop",
        ],
        [
          "Kids Summer Dress",
          "kids",
          "Light summer dress",
          32.99,
          110,
          "https://images.unsplash.com/photo-1595777707802-51b40f1e887b?w=500&h=500&fit=crop",
        ],
        [
          "Kids Skirt",
          "kids",
          "Cute skirt for kids",
          29.99,
          120,
          "https://images.unsplash.com/photo-1595777707802-51b40f1e887b?w=500&h=500&fit=crop",
        ],
        [
          "Kids Leggings",
          "kids",
          "Stretchy kids leggings",
          19.99,
          150,
          "https://images.unsplash.com/photo-1506629082632-eca07ce68f77?w=500&h=500&fit=crop",
        ],
        [
          "Kids Tank Top",
          "kids",
          "Lightweight tank top",
          14.99,
          170,
          "https://images.unsplash.com/photo-1503342320505-c894ddcb4d4f?w=500&h=500&fit=crop",
        ],
        [
          "Kids Sleepwear Set",
          "kids",
          "Comfortable sleepwear set",
          26.99,
          140,
          "https://images.unsplash.com/photo-1503342320505-c894ddcb4d4f?w=500&h=500&fit=crop",
        ],
        [
          "Kids Thermal Underwear",
          "kids",
          "Warm thermal set",
          24.99,
          130,
          "https://images.unsplash.com/photo-1503342320505-c894ddcb4d4f?w=500&h=500&fit=crop",
        ],
        [
          "Kids Active Wear Set",
          "kids",
          "Sporty active wear set",
          39.99,
          100,
          "https://images.unsplash.com/photo-1506629082632-eca07ce68f77?w=500&h=500&fit=crop",
        ],

        // FOOTWEAR (20 products)
        [
          "Classic Running Shoes",
          "footwear",
          "Professional running shoes with cushioning",
          79.99,
          100,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "Trail Running Shoes",
          "footwear",
          "Rugged trail running footwear",
          89.99,
          80,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "Lightweight Joggers",
          "footwear",
          "Comfortable everyday joggers",
          69.99,
          95,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "Basketball Shoes",
          "footwear",
          "Performance basketball footwear",
          94.99,
          70,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "Casual White Sneakers",
          "footwear",
          "Versatile white sneakers",
          59.99,
          130,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "Black Slip-On Shoes",
          "footwear",
          "Comfortable slip-on sneakers",
          54.99,
          120,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "High-Top Sneakers",
          "footwear",
          "Classic high-top shoes",
          74.99,
          90,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "Leather Oxford Shoes",
          "footwear",
          "Formal leather oxfords",
          94.99,
          60,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "Casual Loafers",
          "footwear",
          "Comfortable loafer shoes",
          79.99,
          75,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "Chelsea Boots",
          "footwear",
          "Stylish Chelsea boots",
          89.99,
          65,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "Desert Boots",
          "footwear",
          "Classic desert boots",
          84.99,
          70,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "Hiking Boots",
          "footwear",
          "Durable hiking footwear",
          109.99,
          55,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "Waterproof Winter Boots",
          "footwear",
          "Warm waterproof boots",
          99.99,
          60,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "Summer Sandals",
          "footwear",
          "Comfortable summer sandals",
          39.99,
          150,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "Flip Flops",
          "footwear",
          "Casual flip flops",
          19.99,
          200,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "Gladiator Sandals",
          "footwear",
          "Stylish gladiator sandals",
          49.99,
          100,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "Sport Slides",
          "footwear",
          "Comfortable sport slides",
          34.99,
          130,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "Water Shoes",
          "footwear",
          "Quick-dry water shoes",
          44.99,
          110,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "Kids Running Shoes",
          "footwear",
          "Durable kids running shoes",
          49.99,
          140,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        [
          "Kids School Shoes",
          "footwear",
          "Classic school shoes for kids",
          44.99,
          130,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],

        // ACCESSORIES (10 products)
        [
          "Baseball Cap Black",
          "accessories",
          "Classic black baseball cap",
          19.99,
          200,
          "https://images.unsplash.com/photo-1533419461282-d540cf0d6145?w=500&h=500&fit=crop",
        ],
        [
          "Beanie Hat",
          "accessories",
          "Warm knit beanie",
          22.99,
          180,
          "https://images.unsplash.com/photo-1533419461282-d540cf0d6145?w=500&h=500&fit=crop",
        ],
        [
          "Leather Belt Brown",
          "accessories",
          "Classic leather belt",
          34.99,
          150,
          "https://images.unsplash.com/photo-1533419461282-d540cf0d6145?w=500&h=500&fit=crop",
        ],
        [
          "Canvas Belt",
          "accessories",
          "Casual canvas belt",
          24.99,
          170,
          "https://images.unsplash.com/photo-1533419461282-d540cf0d6145?w=500&h=500&fit=crop",
        ],
        [
          "Aviator Sunglasses",
          "accessories",
          "Classic aviator sunglasses",
          44.99,
          120,
          "https://images.unsplash.com/photo-1533419461282-d540cf0d6145?w=500&h=500&fit=crop",
        ],
        [
          "Wayfarer Sunglasses",
          "accessories",
          "Trendy wayfarer style glasses",
          49.99,
          100,
          "https://images.unsplash.com/photo-1533419461282-d540cf0d6145?w=500&h=500&fit=crop",
        ],
        [
          "Analog Wristwatch",
          "accessories",
          "Classic analog wristwatch",
          59.99,
          90,
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
        ],
        [
          "Smart Watch",
          "accessories",
          "Fitness tracking smartwatch",
          199.99,
          50,
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
        ],
        [
          "Leather Wallet",
          "accessories",
          "Premium leather wallet",
          49.99,
          100,
          "https://images.unsplash.com/photo-1533419461282-d540cf0d6145?w=500&h=500&fit=crop",
        ],
        [
          "Travel Backpack",
          "accessories",
          "Durable travel backpack",
          89.99,
          80,
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop",
        ],
      ];

      for (const product of sampleProducts) {
        await connection.execute(
          "INSERT INTO products (name, category, description, price, stock, image) VALUES (?, ?, ?, ?, ?, ?)",
          product,
        );
      }
      console.log("✅ 100 Sample products inserted");
    }

    console.log("\n🎉 Database initialization completed successfully!");
    console.log("\n📝 Default Admin Credentials:");
    console.log("   Email: admin@store.com");
    console.log("   Password: admin123\n");
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
