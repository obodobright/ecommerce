// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Helper function to get auth token
function getAuthToken() {
    return localStorage.getItem('auth_token');
}

// Helper function to set auth token
function setAuthToken(token) {
    if (token) {
        localStorage.setItem('auth_token', token);
    } else {
        localStorage.removeItem('auth_token');
    }
}

// Helper function to get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('current_user');
    return userStr ? JSON.parse(userStr) : null;
}

// Helper function to set current user
function setCurrentUser(user) {
    if (user) {
        localStorage.setItem('current_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('current_user');
    }
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// Auth API
const authAPI = {
    register: async (userData) => {
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: userData
        });
        if (response.token) {
            setAuthToken(response.token);
            setCurrentUser(response.user);
        }
        return response;
    },
    
    login: async (email, password) => {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
        if (response.token) {
            setAuthToken(response.token);
            setCurrentUser(response.user);
        }
        return response;
    },
    
    logout: () => {
        setAuthToken(null);
        setCurrentUser(null);
    },
    
    getCurrentUser: async () => {
        return await apiRequest('/auth/me');
    }
};

// Products API
const productsAPI = {
    getAll: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.search) params.append('search', filters.search);
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        
        const query = params.toString();
        return await apiRequest(`/products${query ? '?' + query : ''}`);
    },
    
    getById: async (id) => {
        return await apiRequest(`/products/${id}`);
    }
};

// Cart API
const cartAPI = {
    get: async () => {
        return await apiRequest('/cart');
    },
    
    add: async (productId, quantity = 1) => {
        return await apiRequest('/cart/add', {
            method: 'POST',
            body: { productId, quantity }
        });
    },
    
    update: async (cartItemId, quantity) => {
        return await apiRequest(`/cart/${cartItemId}`, {
            method: 'PUT',
            body: { quantity }
        });
    },
    
    remove: async (cartItemId) => {
        return await apiRequest(`/cart/${cartItemId}`, {
            method: 'DELETE'
        });
    },
    
    clear: async () => {
        return await apiRequest('/cart', {
            method: 'DELETE'
        });
    }
};

// Orders API
const ordersAPI = {
    getAll: async () => {
        return await apiRequest('/orders');
    },
    
    getById: async (id) => {
        return await apiRequest(`/orders/${id}`);
    },
    
    create: async (orderData) => {
        return await apiRequest('/orders', {
            method: 'POST',
            body: orderData
        });
    }
};

// Admin API
const adminAPI = {
    getDashboard: async () => {
        return await apiRequest('/admin/dashboard');
    },
    
    getOrders: async (status = null) => {
        const query = status ? `?status=${status}` : '';
        return await apiRequest(`/admin/orders${query}`);
    },
    
    getOrder: async (id) => {
        return await apiRequest(`/admin/orders/${id}`);
    },
    
    updateOrderStatus: async (orderId, status) => {
        return await apiRequest(`/admin/orders/${orderId}/status`, {
            method: 'PUT',
            body: { status }
        });
    },
    
    createProduct: async (productData) => {
        return await apiRequest('/products', {
            method: 'POST',
            body: productData
        });
    },
    
    updateProduct: async (id, productData) => {
        return await apiRequest(`/products/${id}`, {
            method: 'PUT',
            body: productData
        });
    },
    
    deleteProduct: async (id) => {
        return await apiRequest(`/products/${id}`, {
            method: 'DELETE'
        });
    }
};

// Export API functions
window.api = {
    auth: authAPI,
    products: productsAPI,
    cart: cartAPI,
    orders: ordersAPI,
    admin: adminAPI,
    getAuthToken,
    setAuthToken,
    getCurrentUser,
    setCurrentUser
};

