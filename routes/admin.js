const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken, isAdmin } = require("../middleware/auth");

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(isAdmin);

// Utility function: safely parse JSON list
function parseItems(order) {
  try {
    return JSON.parse(order.items || "[]");
  } catch (err) {
    return [];
  }
}

// Get dashboard statistics
router.get("/dashboard", async (req, res) => {
  try {
    const [productCount] = await pool.execute("SELECT COUNT(*) as count FROM products");
    const [orderCount] = await pool.execute("SELECT COUNT(*) as count FROM orders");
    const [pendingCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM orders WHERE status = ?",
      ["pending"]
    );
    const [revenue] = await pool.execute(
      "SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != ?",
      ["cancelled"]
    );

    res.json({
      totalProducts: productCount[0].count,
      totalOrders: orderCount[0].count,
      pendingOrders: pendingCount[0].count,
      totalRevenue: parseFloat(revenue[0].total),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all orders (admin view)
router.get("/orders", async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
            SELECT 
                o.*, 
                u.full_name AS customer_name, 
                u.email AS customer_email,
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
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
        `;

    const params = [];
    if (status) {
      query += " WHERE o.status = ?";
      params.push(status);
    }

    query += " GROUP BY o.id ORDER BY o.created_at DESC";

    const [orders] = await pool.execute(query, params);

    const ordersWithItems = orders.map((order) => ({
      ...order,
      items: parseItems(order),
    }));

    res.json(ordersWithItems);
  } catch (error) {
    console.error("Get admin orders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a single order (admin view)
router.get("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.execute(
      `SELECT 
                o.*, 
                u.full_name AS customer_name, 
                u.email AS customer_email,
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
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.id = ?
            GROUP BY o.id`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orders[0];
    order.items = parseItems(order);

    res.json(order);
  } catch (error) {
    console.error("Get admin order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update order status
router.put("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const [result] = await pool.execute("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order status updated" });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
