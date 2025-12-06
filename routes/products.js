const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all products (with optional filters)
router.get('/', async (req, res) => {
    try {
        const { category, search, sortBy } = req.query;
        
        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        if (search) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        // Sorting
        if (sortBy === 'price-low') {
            query += ' ORDER BY price ASC';
        } else if (sortBy === 'price-high') {
            query += ' ORDER BY price DESC';
        } else {
            query += ' ORDER BY name ASC';
        }

        const [products] = await pool.execute(query, params);
        res.json(products);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [products] = await pool.execute(
            'SELECT * FROM products WHERE id = ?',
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(products[0]);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create product (Admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, category, description, price, stock, image } = req.body;

        if (!name || !category || !description || price === undefined || stock === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [result] = await pool.execute(
            'INSERT INTO products (name, category, description, price, stock, image) VALUES (?, ?, ?, ?, ?, ?)',
            [name, category, description, price, stock, image || null]
        );

        const [newProduct] = await pool.execute(
            'SELECT * FROM products WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(newProduct[0]);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update product (Admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, description, price, stock, image } = req.body;

        // Check if product exists
        const [existing] = await pool.execute(
            'SELECT id FROM products WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await pool.execute(
            'UPDATE products SET name = ?, category = ?, description = ?, price = ?, stock = ?, image = ? WHERE id = ?',
            [name, category, description, price, stock, image || null, id]
        );

        const [updatedProduct] = await pool.execute(
            'SELECT * FROM products WHERE id = ?',
            [id]
        );

        res.json(updatedProduct[0]);
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete product (Admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            'DELETE FROM products WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

