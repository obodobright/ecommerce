const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All order routes require authentication
router.use(authenticateToken);

// Utility function to convert GROUP_CONCAT JSON into real JSON array
function parseItems(order) {
    try {
        return JSON.parse(order.items || "[]");
    } catch (e) {
        return [];
    }
}

// Get user's orders
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;

        const [orders] = await pool.execute(
            `SELECT 
                o.*,
                CONCAT(
                    '[', 
                    GROUP_CONCAT(
                        CONCAT(
                            '{"productId":', oi.product_id,
                            ',"productName":"', p.name, '"',
                            ',"quantity":', oi.quantity,
                            ',"price":', oi.price,
                            '}'
                        ) SEPARATOR ','
                    ),
                    ']'
                ) AS items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.user_id = ?
            GROUP BY o.id
            ORDER BY o.created_at DESC`,
            [userId]
        );

        const ordersWithItems = orders.map(order => ({
            ...order,
            items: parseItems(order)
        }));

        res.json(ordersWithItems);
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single order
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [orders] = await pool.execute(
            `SELECT 
                o.*,
                CONCAT(
                    '[', 
                    GROUP_CONCAT(
                        CONCAT(
                            '{"productId":', oi.product_id,
                            ',"productName":"', p.name, '"',
                            ',"quantity":', oi.quantity,
                            ',"price":', oi.price,
                            '}'
                        ) SEPARATOR ','
                    ),
                    ']'
                ) AS items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.id = ? AND o.user_id = ?
            GROUP BY o.id`,
            [id, userId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orders[0];
        order.items = parseItems(order);

        res.json(order);
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new order
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { shippingInfo, paymentMethod } = req.body;

        if (!shippingInfo || !paymentMethod) {
            return res.status(400).json({ error: 'Shipping info and payment method are required' });
        }

        // Get cart items
        const [cartItems] = await pool.execute(
            `SELECT c.product_id, c.quantity, p.price, p.stock, p.name
             FROM cart c
             JOIN products p ON c.product_id = p.id
             WHERE c.user_id = ?`,
            [userId]
        );

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Check stock
        for (const item of cartItems) {
            if (item.quantity > item.stock) {
                return res.status(400).json({
                    error: `Insufficient stock for ${item.name}. Available: ${item.stock}`
                });
            }
        }

        // Totals
        let subtotal = 0;
        for (const item of cartItems) {
            subtotal += item.price * item.quantity;
        }
        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Create order
            const [orderResult] = await connection.execute(
                `INSERT INTO orders (
                    user_id, shipping_name, shipping_email, shipping_phone, 
                    shipping_address, shipping_city, shipping_state, shipping_zip, 
                    payment_method, subtotal, tax, total, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    shippingInfo.fullName,
                    shippingInfo.email,
                    shippingInfo.phone,
                    shippingInfo.address,
                    shippingInfo.city,
                    shippingInfo.state,
                    shippingInfo.zipCode || shippingInfo.zip,
                    paymentMethod,
                    subtotal,
                    tax,
                    total,
                    'pending'
                ]
            );

            const orderId = orderResult.insertId;

            // Insert items + update stock
            for (const item of cartItems) {
                await connection.execute(
                    `INSERT INTO order_items (order_id, product_id, quantity, price)
                     VALUES (?, ?, ?, ?)`,
                    [orderId, item.product_id, item.quantity, item.price]
                );

                await connection.execute(
                    `UPDATE products SET stock = stock - ? WHERE id = ?`,
                    [item.quantity, item.product_id]
                );
            }

            // Clear cart
            await connection.execute(`DELETE FROM cart WHERE user_id = ?`, [userId]);

            await connection.commit();

            // Fetch the new order with items
            const [newOrder] = await connection.execute(
                `SELECT 
                    o.*,
                    CONCAT(
                        '[', 
                        GROUP_CONCAT(
                            CONCAT(
                                '{"productId":', oi.product_id,
                                ',"productName":"', p.name, '"',
                                ',"quantity":', oi.quantity,
                                ',"price":', oi.price,
                                '}'
                            ) SEPARATOR ','
                        ),
                        ']'
                    ) AS items
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE o.id = ?
                GROUP BY o.id`,
                [orderId]
            );

            const order = newOrder[0];
            order.items = parseItems(order);

            res.status(201).json(order);

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
