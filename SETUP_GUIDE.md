# Step-by-Step Setup Guide

## Prerequisites

Before starting, ensure you have:
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MySQL** (v5.7 or higher) - [Download here](https://dev.mysql.com/downloads/mysql/)
- **npm** (comes with Node.js)

---

## Step 1: Install MySQL

### Windows:
1. Download MySQL Installer from [mysql.com](https://dev.mysql.com/downloads/installer/)
2. Run the installer
3. Choose "Developer Default" or "Server only"
4. During installation:
   - Set root password (remember this!)
   - Note the port (default is 3306)
   - Complete the installation

### macOS:
```bash
# Using Homebrew
brew install mysql
brew services start mysql
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### Verify MySQL Installation:
```bash
mysql --version
```

---

## Step 2: Start MySQL Service

### Windows:
- Open "Services" (Win + R, type `services.msc`)
- Find "MySQL80" or "MySQL"
- Right-click → Start (if not running)

Or use Command Prompt as Administrator:
```bash
net start MySQL80
```

### macOS:
```bash
brew services start mysql
```

### Linux:
```bash
sudo systemctl start mysql
# Or
sudo service mysql start
```

---

## Step 3: Configure Database Connection

1. **Open MySQL Command Line** (or MySQL Workbench):
   ```bash
   mysql -u root -p
   ```
   Enter your root password when prompted.

2. **Create a database user (Optional but recommended)**:
   ```sql
   CREATE USER 'ecommerce_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON ecommerce_db.* TO 'ecommerce_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

   **Note:** You can skip this step and use root user, but using a dedicated user is more secure.

---

## Step 4: Configure Environment Variables

1. **Navigate to your project directory**:
   ```bash
   cd ecommerce-assignment
   ```

2. **Create `.env` file**:
   - Copy `.env.example` to `.env`
   - On Windows (PowerShell):
     ```powershell
     Copy-Item .env.example .env
     ```
   - On macOS/Linux:
     ```bash
     cp .env.example .env
     ```

3. **Edit `.env` file** with your database credentials:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_root_password
   DB_NAME=ecommerce_db
   DB_PORT=3306

   # JWT Secret Key (change this to a random string)
   JWT_SECRET=your_secret_key_here_change_in_production

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

   **Important:**
   - Replace `your_mysql_root_password` with your actual MySQL root password
   - Replace `your_secret_key_here_change_in_production` with a random string (e.g., use a password generator)
   - If you created a dedicated user, use those credentials instead

---

## Step 5: Install Node.js Dependencies

1. **Open terminal/command prompt** in the project directory

2. **Install all dependencies**:
   ```bash
   npm install
   ```

   This will install:
   - express
   - mysql2
   - bcryptjs
   - jsonwebtoken
   - dotenv
   - cors
   - body-parser
   - nodemon (for development)

   Wait for installation to complete (may take 1-2 minutes).

---

## Step 6: Initialize the Database

1. **Make sure MySQL is running** (Step 2)

2. **Run the database initialization script**:
   ```bash
   npm run init-db
   ```

   This script will:
   - Create the `ecommerce_db` database (if it doesn't exist)
   - Create all necessary tables (users, products, cart, orders, order_items)
   - Insert sample products
   - Create default admin user

3. **Expected output**:
   ```
   ✅ Connected to MySQL server
   ✅ Database 'ecommerce_db' ready
   ✅ Users table created
   ✅ Products table created
   ✅ Cart table created
   ✅ Orders table created
   ✅ Order items table created
   ✅ Default admin user created (admin@store.com / admin123)
   ✅ Sample products inserted
   
   🎉 Database initialization completed successfully!
   
   📝 Default Admin Credentials:
      Email: admin@store.com
      Password: admin123
   ```

4. **If you see errors**:
   - Check MySQL is running
   - Verify credentials in `.env` file
   - Ensure MySQL user has CREATE DATABASE privileges

---

## Step 7: Start the Backend Server

### Option A: Production Mode
```bash
npm start
```

### Option B: Development Mode (with auto-reload)
```bash
npm run dev
```

**Expected output**:
```
✅ Database connected successfully
🚀 Server running on http://localhost:3000
📁 Frontend available at http://localhost:3000/index.html
```

---

## Step 8: Verify Everything is Working

1. **Check server is running**:
   - Open browser: http://localhost:3000/api/health
   - Should see: `{"status":"OK","message":"Server is running"}`

2. **Test database connection**:
   - If you see "✅ Database connected successfully" in console, you're good!

3. **Access the frontend**:
   - Open: http://localhost:3000/index.html
   - You should see the homepage

4. **Test admin login**:
   - Go to: http://localhost:3000/admin/login.html
   - Login with:
     - Email: `admin@store.com`
     - Password: `admin123`

---

## Troubleshooting

### Issue: "Database connection failed"
**Solutions:**
- Check MySQL service is running
- Verify credentials in `.env` file
- Test connection manually:
  ```bash
  mysql -u root -p
  ```
- Check if port 3306 is correct

### Issue: "Access denied for user"
**Solutions:**
- Verify username and password in `.env`
- Check if user has proper privileges:
  ```sql
  GRANT ALL PRIVILEGES ON ecommerce_db.* TO 'your_user'@'localhost';
  FLUSH PRIVILEGES;
  ```

### Issue: "Port 3000 already in use"
**Solutions:**
- Change PORT in `.env` to another port (e.g., 3001)
- Or stop the process using port 3000:
  - Windows: `netstat -ano | findstr :3000` then `taskkill /PID <pid> /F`
  - macOS/Linux: `lsof -ti:3000 | xargs kill`

### Issue: "Cannot find module"
**Solutions:**
- Run `npm install` again
- Delete `node_modules` folder and `package-lock.json`, then run `npm install`

### Issue: "Database already exists"
**Solutions:**
- This is fine! The script will skip creating it
- If you want to start fresh:
  ```sql
  DROP DATABASE ecommerce_db;
  ```
  Then run `npm run init-db` again

---

## Quick Reference Commands

```bash
# Start MySQL (Windows)
net start MySQL80

# Start MySQL (macOS)
brew services start mysql

# Start MySQL (Linux)
sudo systemctl start mysql

# Install dependencies
npm install

# Initialize database
npm run init-db

# Start server (production)
npm start

# Start server (development with auto-reload)
npm run dev

# Stop server
Ctrl + C
```

---

## Next Steps

Once your backend is running:

1. **Test the API endpoints** using:
   - Postman
   - Browser (for GET requests)
   - Frontend application

2. **Access the frontend**:
   - Homepage: http://localhost:3000/index.html
   - User registration: http://localhost:3000/user/register.html
   - Admin login: http://localhost:3000/admin/login.html

3. **Create your first user**:
   - Register at: http://localhost:3000/user/register.html
   - Or use admin credentials to login

---

## Security Notes

⚠️ **Important for Production:**

1. **Change JWT_SECRET** to a strong random string
2. **Change admin password** after first login
3. **Use environment variables** for all sensitive data
4. **Don't commit `.env` file** to version control
5. **Use HTTPS** in production
6. **Set up proper MySQL user** with limited privileges
7. **Enable MySQL SSL** for production

---

## Need Help?

If you encounter issues:
1. Check the error message in the terminal
2. Verify MySQL is running: `mysql --version`
3. Test database connection manually
4. Check `.env` file has correct credentials
5. Ensure all dependencies are installed: `npm list`

---

**You're all set! 🎉**

Your ecommerce backend should now be running on http://localhost:3000

