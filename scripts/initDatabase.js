const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  port: process.env.DB_PORT || 3307,
  database: "myapp",
};

const dbName = process.env.DB_NAME || "ecommerce_db";

async function initDatabase() {
  let connection;

  try {
    connection = await mysql.createConnection(process.env.MYSQL_URL || dbConfig);
    console.log("✅ Connected to MySQL server");

    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' ready`);

    await connection.end();

    // connection = await mysql.createConnection({
    //   ...dbConfig,
    //   database: dbName,
    // });
    connection = await mysql.createConnection(process.env.MYSQL_URL);
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
          "https://up.yimg.com/ib/th/id/OIP.Gk4ngFSLZeccDjG5ZGxthwHaJo?pid=Api&rs=1&c=1&qlt=95&w=95&h=123",
        ],
        [
          "Oxford Button-Up Shirt",
          "mens",
          "Crisp oxford cloth button-down shirt",
          44.99,
          80,
          "https://up.yimg.com/ib/th/id/OIP.CFhKioBEFhaSZSUNb-d-LwHaJ4?pid=Api&rs=1&c=1&qlt=95&w=82&h=110",
        ],
        [
          "Casual Long Sleeve Henley",
          "mens",
          "Soft long-sleeve henley with button placket",
          32.99,
          90,
          "https://up.yimg.com/ib/th/id/OIP.hw9rGvJ0iQZL9LWIpByRAwHaI0?pid=Api&rs=1&c=1&qlt=95&w=99&h=118",
        ],
        [
          "Classic Blue Denim Jeans",
          "mens",
          "Timeless straight-fit denim",
          54.99,
          120,
          "https://up.yimg.com/ib/th/id/OIP.JhtQywUG0gyFAQ9UMmo4GQHaHa?pid=Api&rs=1&c=1&qlt=95&w=110&h=110",
        ],
        [
          "Slim Fit Black Jeans",
          "mens",
          "Modern slim-fit black jeans",
          59.99,
          110,
          "https://up.yimg.com/ib/th/id/OIP.tI497r7fcktV-8Yb95lr5QHaJQ?pid=Api&rs=1&c=1&qlt=95&w=90&h=112",
        ],
        [
          "Distressed Ripped Jeans",
          "mens",
          "Trendy distressed ripped jeans",
          49.99,
          70,
          "https://up.yimg.com/ib/th/id/OIP.aKYJRe6lOfQ3ieMfAVmVRAHaJ4?pid=Api&rs=1&c=1&qlt=95&w=82&h=109",
        ],
        [
          "Cargo Pants Olive",
          "mens",
          "Durable cargo pants with multiple pockets",
          52.99,
          85,
          "https://up.yimg.com/ib/th/id/OIP.wDcAhU4Szk0di6-kWkt3WgHaJQ?pid=Api&rs=1&c=1&qlt=95&w=97&h=121",
        ],
        [
          "Classic Chinos Khaki",
          "mens",
          "Versatile khaki chinos for any occasion",
          39.99,
          100,
          "https://up.yimg.com/ib/th/id/OIP.WE6NHGO8XmfrqTJZ9DaStgHaKs?pid=Api&rs=1&c=1&qlt=95&w=72&h=105",
        ],

        [
          "Athletic Fleece Hoodie",
          "mens",
          "Warm fleece-lined pullover hoodie",
          49.99,
          94,
          "https://up.yimg.com/ib/th/id/OIP.l8MsFdLKetBaw9Nkp511QQHaJQ?pid=Api&rs=1&c=1&qlt=95&w=96&h=120",
        ],
        [
          "Zip-Up Hoodie Gray",
          "mens",
          "Comfortable zip-up hoodie in heather gray",
          52.99,
          85,
          "https://up.yimg.com/ib/th/id/OIP.pr4_Ec_JpthOHjj8Pdm0VgHaJ4?pid=Api&rs=1&c=1&qlt=95&w=84&h=113",
        ],
        [
          "Crewneck Sweatshirt",
          "mens",
          "Classic crewneck sweatshirt",
          44.99,
          100,
          "https://up.yimg.com/ib/th/id/OIP.1Ex5NdRRnm2boHWE1zgadwHaJ4?pid=Api&rs=1&c=1&qlt=95&w=86&h=115",
        ],
        [
          "Lightweight Bomber Jacket",
          "mens",
          "Sleek bomber jacket for layering",
          89.99,
          60,
          "https://up.yimg.com/ib/th/id/OIP.D-vBCnr1YaS9Ob9BaxWrXwHaHa?pid=Api&rs=1&c=1&qlt=95&w=118&h=118",
        ],
        [
          "Casual Denim Jacket",
          "mens",
          "Classic blue denim jacket",
          74.99,
          75,
          "https://up.yimg.com/ib/th/id/OIP.vVMB34-IXjiTu_lWzJxGVAHaHa?pid=Api&rs=1&c=1&qlt=95&w=110&h=110",
        ],
        [
          "Wool Blend Cardigan",
          "mens",
          "Warm wool blend cardigan sweater",
          64.99,
          50,
          "https://up.yimg.com/ib/th/id/OIP.AkYRPOWxJln5ZYVfc2f9NQHaI4?pid=Api&rs=1&c=1&qlt=95&w=92&h=110",
        ],
        [
          "V-Neck Pullover Sweater",
          "mens",
          "Elegant v-neck pullover",
          54.99,
          70,
          "https://up.yimg.com/ib/th/id/OIP.3R6tmReLf7jFL7B-OO0cwgHaHa?pid=Api&rs=1&c=1&qlt=95&w=122&h=122",
        ],
        [
          "Crew Neck Cable Knit",
          "mens",
          "Textured cable knit sweater",
          59.99,
          65,
          "https://up.yimg.com/ib/th/id/OIP.eZR9t0dkFj39nF5cxCZrswHaJQ?pid=Api&rs=1&c=1&qlt=95&w=97&h=121",
        ],

        [
          "Athletic Shorts Black",
          "mens",
          "Comfortable athletic shorts with liner",
          29.99,
          120,
          "https://up.yimg.com/ib/th/id/OIP.JzA1yoN5Am_8JeXwrcBmYwHaJ4?pid=Api&rs=1&c=1&qlt=95&w=81&h=108",
        ],
        [
          "Swim Trunks Blue",
          "mens",
          "Quick-dry swim trunks",
          34.99,
          100,
          "https://up.yimg.com/ib/th/id/OIP.y-SE2rRHUjLBYZyvK9S88wHaLH?pid=Api&rs=1&c=1&qlt=95&w=81&h=122",
        ],
        [
          "Casual Linen Shorts",
          "mens",
          "Breathable linen shorts",
          39.99,
          90,
          "https://up.yimg.com/ib/th/id/OIP.3iRWf9Onm42OYEkWMT_HNgHaHa?pid=Api&rs=1&c=1&qlt=95&w=106&h=106",
        ],
        [
          "Performance Tank Top",
          "mens",
          "Moisture-wicking tank top",
          19.99,
          150,
          "https://up.yimg.com/ib/th/id/OIP.VerD_mWT90fg12dHADbubAHaJC?pid=Api&rs=1&c=1&qlt=95&w=88&h=108",
        ],
        [
          "Thermal Base Layer",
          "mens",
          "Warm thermal undershirt",
          32.99,
          80,
          "https://up.yimg.com/ib/th/id/OIP.0s9WBALrRe32jB6KRxKdAQHaHZ?pid=Api&rs=1&c=1&qlt=95&w=113&h=113",
        ],
        [
          "Compression Shirt",
          "mens",
          "Compression wear for support",
          44.99,
          70,
          "https://up.yimg.com/ib/th/id/OIP.sxoliLHJE09IS2NvNtehbgHaHa?pid=Api&rs=1&c=1&qlt=95&w=122&h=122",
        ],
        [
          "Graphic Print Tee",
          "mens",
          "Bold graphic print t-shirt",
          28.99,
          110,
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
        ],

        [
          "Classic White Tank Top",
          "womens",
          "Essential white tank top",
          19.99,
          180,
          "https://up.yimg.com/ib/th/id/OIP.ZrErsfEYt8vggcGdjTtaXAHaHa?pid=Api&rs=1&c=1&qlt=95&w=108&h=108",
        ],
        [
          "V-Neck T-Shirt",
          "womens",
          "Flattering v-neck tee",
          24.99,
          160,
          "https://up.yimg.com/ib/th/id/OIP.Hin6EO4WCN6aGTjCrBgPBAHaJ4?pid=Api&rs=1&c=1&qlt=95&w=86&h=115",
        ],
        [
          "Fitted Crew Neck Tee",
          "womens",
          "Fitted crew neck t-shirt",
          22.99,
          150,
          "https://up.yimg.com/ib/th/id/OIP.67JBkQJi-ulIpKZ_jWLGsQHaL0?pid=Api&rs=1&c=1&qlt=95&w=73&h=117",
        ],
        [
          "Long Sleeve Crop Top",
          "womens",
          "Trendy long sleeve crop top",
          32.99,
          100,
          "https://up.yimg.com/ib/th/id/OIP.u8yl3LRSU858Ivj8fViflAHaHa?pid=Api&rs=1&c=1&qlt=95&w=110&h=110",
        ],
        [
          "Off Shoulder Blouse",
          "womens",
          "Elegant off-shoulder blouse",
          44.99,
          85,
          "https://up.yimg.com/ib/th/id/OIP.AdgQzw3I8sqFZEoFsRpz0QHaKX?pid=Api&rs=1&c=1&qlt=95&w=81&h=113",
        ],
        [
          "Button-Up Dress Shirt",
          "womens",
          "Professional button-up shirt",
          49.99,
          75,
          "https://up.yimg.com/ib/th/id/OIP.ahDZ76dckc3JaLX5x7hx_QHaHa?pid=Api&rs=1&c=1&qlt=95&w=110&h=110",
        ],
        [
          "Floral Print Blouse",
          "womens",
          "Beautiful floral patterned blouse",
          39.99,
          90,
          "https://up.yimg.com/ib/th/id/OIP.frnbviM2BEQ10fqUQdmj0AHaKT?pid=Api&rs=1&c=1&qlt=95&w=78&h=108",
        ],
        [
          "Silk Camisole",
          "womens",
          "Luxurious silk camisole",
          54.99,
          60,
          "https://up.yimg.com/ib/th/id/OIP.p6sbZWfzxAhOu-Wm82HFKgHaLH?pid=Api&rs=1&c=1&qlt=95&w=81&h=122",
        ],

        [
          "Kids Cotton T-Shirt",
          "kids",
          "Soft cotton t-shirt for kids",
          16.99,
          200,
          "https://up.yimg.com/ib/th/id/OIP.7_Stwl_1Cxi9ZgMyxmYCxwHaHa?pid=Api&rs=1&c=1&qlt=95&w=123&h=123",
        ],
        [
          "Kids Graphic Tee",
          "kids",
          "Fun character graphic t-shirt",
          18.99,
          180,
          "https://up.yimg.com/ib/th/id/OIP.ZAZffBZk0jHPA8CzBrHb0wHaHa?pid=Api&rs=1&c=1&qlt=95&w=118&h=118",
        ],
        [
          "Kids Long Sleeve Shirt",
          "kids",
          "Comfortable long sleeve shirt",
          19.99,
          160,
          "https://up.yimg.com/ib/th/id/OIP.Tm-pTBnvbzgmMjokP1sZNAHaHa?pid=Api&rs=1&c=1&qlt=95&w=121&h=121",
        ],

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
          "Chelsea Boots",
          "footwear",
          "Stylish Chelsea boots",
          89.99,
          65,
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],

        [
          "Baseball Cap Black",
          "accessories",
          "Classic black baseball cap",
          19.99,
          200,
          "https://up.yimg.com/ib/th/id/OIP.K3aIvAFAeAmbtpzXkDAXPgHaFC?pid=Api&rs=1&c=1&qlt=95&w=165&h=112",
        ],
        [
          "Beanie Hat",
          "accessories",
          "Warm knit beanie",
          22.99,
          180,
          "https://up.yimg.com/ib/th/id/OIP.BQdNWD9htSVDz579N-jorQHaHa?pid=Api&rs=1&c=1&qlt=95&w=121&h=121",
        ],
        [
          "Leather Belt Brown",
          "accessories",
          "Classic leather belt",
          34.99,
          150,
          "https://up.yimg.com/ib/th/id/OIP.StLxGyTtwQNt1U0n9SncNAHaEm?pid=Api&rs=1&c=1&qlt=95&w=160&h=99",
        ],
        [
          "Aviator Sunglasses",
          "accessories",
          "Classic aviator sunglasses",
          44.99,
          120,
          "https://tse3.mm.bing.net/th/id/OIP.hQDvEd2QRTfQOFG78vXTkwHaDt?pid=Api&h=220&P=0",
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
          "https://up.yimg.com/ib/th/id/OIP.YOgTiD8WqsYNTeAh8r4yCwHaGd?pid=Api&rs=1&c=1&qlt=95&w=126&h=109",
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
