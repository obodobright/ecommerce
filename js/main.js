// Local Storage Keys
const STORAGE_KEYS = {
    CART: 'ecommerce_cart',
    USER: 'ecommerce_user',
    PRODUCTS: 'ecommerce_products',
    ORDERS: 'ecommerce_orders'
};

// Initialize sample data if not exists
function initializeData() {
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
        const sampleProducts = [
            { id: 1, name: 'Laptop Pro 15', category: 'electronics', price: 1299.99, stock: 10, image: 'https://via.placeholder.com/300x300?text=Laptop', description: 'High-performance laptop with latest processor' },
            { id: 2, name: 'Wireless Mouse', category: 'electronics', price: 29.99, stock: 50, image: 'https://via.placeholder.com/300x300?text=Mouse', description: 'Ergonomic wireless mouse' },
            { id: 3, name: 'Smartphone X', category: 'electronics', price: 899.99, stock: 25, image: 'https://via.placeholder.com/300x300?text=Phone', description: 'Latest smartphone with advanced features' },
            { id: 4, name: 'Cotton T-Shirt', category: 'clothing', price: 19.99, stock: 100, image: 'https://via.placeholder.com/300x300?text=T-Shirt', description: 'Comfortable cotton t-shirt' },
            { id: 5, name: 'Jeans Classic', category: 'clothing', price: 49.99, stock: 75, image: 'https://via.placeholder.com/300x300?text=Jeans', description: 'Classic fit jeans' },
            { id: 6, name: 'Winter Jacket', category: 'clothing', price: 89.99, stock: 30, image: 'https://via.placeholder.com/300x300?text=Jacket', description: 'Warm winter jacket' },
            { id: 7, name: 'Coffee Table', category: 'home', price: 199.99, stock: 15, image: 'https://via.placeholder.com/300x300?text=Table', description: 'Modern coffee table' },
            { id: 8, name: 'Garden Chair', category: 'home', price: 79.99, stock: 40, image: 'https://via.placeholder.com/300x300?text=Chair', description: 'Comfortable garden chair' },
            { id: 9, name: 'Plant Pot Set', category: 'home', price: 34.99, stock: 60, image: 'https://via.placeholder.com/300x300?text=Pot', description: 'Set of 3 decorative plant pots' }
        ];
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(sampleProducts));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.CART)) {
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    }
}

// Cart Management
function getCart() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || '[]');
}

function saveCart(cart) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
}

function addToCart(productId, quantity = 1) {
    const cart = getCart();
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ productId, quantity });
    }
    
    saveCart(cart);
    updateCartCount();
    return cart;
}

function removeFromCart(productId) {
    const cart = getCart().filter(item => item.productId !== productId);
    saveCart(cart);
    updateCartCount();
    return cart;
}

function updateCartQuantity(productId, quantity) {
    const cart = getCart();
    const item = cart.find(item => item.productId === productId);
    
    if (item) {
        if (quantity <= 0) {
            return removeFromCart(productId);
        }
        item.quantity = quantity;
        saveCart(cart);
        updateCartCount();
    }
    
    return cart;
}

function clearCart() {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(el => {
        el.textContent = totalItems;
        el.style.display = totalItems > 0 ? 'inline' : 'none';
    });
}

// Product Management
function getProducts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
}

function saveProducts(products) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

function getProductById(id) {
    const products = getProducts();
    return products.find(p => p.id === parseInt(id));
}

// User Management
function getCurrentUser() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');
}

function setCurrentUser(user) {
    if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
    }
}

// Order Management
function getOrders() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
}

function saveOrder(order) {
    const orders = getOrders();
    order.id = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
    order.date = new Date().toISOString();
    orders.push(order);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return order;
}

// Utility Functions
function formatPrice(price) {
    return `£${parseFloat(price).toFixed(2)}`;
}

function getStockStatus(stock) {
    if (stock === 0) return { class: 'stock-out', text: 'Out of Stock' };
    if (stock < 10) return { class: 'stock-low', text: `Only ${stock} left` };
    return { class: 'stock-in', text: 'In Stock' };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeData();
    updateCartCount();
});

