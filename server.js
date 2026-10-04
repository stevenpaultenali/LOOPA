const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./database");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve the frontend
app.use(express.static(path.join(__dirname, "..")));

// =========================
// TEST ROUTE
// =========================

app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        message: "LOOPA server is working",
        database: "connected"
    });
});

// =========================
// USERS
// =========================

// Get all users
app.get("/api/users", (req, res) => {
    try {
        const users = db
            .prepare(`
                SELECT
                    id,
                    name,
                    email,
                    avatar,
                    verified,
                    created_at
                FROM users
                ORDER BY id DESC
            `)
            .all();

        res.json({
            success: true,
            users
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to get users"
        });
    }
});

// Create user
app.post("/api/users", (req, res) => {
    try {
        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        const existingUser = db
            .prepare("SELECT id FROM users WHERE email = ?")
            .get(email);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        const result = db
            .prepare(`
                INSERT INTO users
                (name, email, password)
                VALUES (?, ?, ?)
            `)
            .run(name, email, password);

        const user = db
            .prepare(`
                SELECT
                    id,
                    name,
                    email,
                    avatar,
                    verified,
                    created_at
                FROM users
                WHERE id = ?
            `)
            .get(result.lastInsertRowid);

        res.status(201).json({
            success: true,
            user
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to create user"
        });
    }
});

// =========================
// ITEMS
// =========================

// Get all items
app.get("/api/items", (req, res) => {
    try {
        const items = db
            .prepare(`
                SELECT
                    items.*,
                    users.name AS owner_name
                FROM items
                JOIN users
                    ON users.id = items.owner_id
                ORDER BY items.id DESC
            `)
            .all();

        res.json({
            success: true,
            items
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to get items"
        });
    }
});

// Create item
app.post("/api/items", (req, res) => {
    try {
        const {
            owner_id,
            name,
            category,
            description,
            price,
            photo,
            pickup_area
        } = req.body;

        if (!owner_id || !name) {
            return res.status(400).json({
                success: false,
                message: "Owner and item name are required"
            });
        }

        const result = db
            .prepare(`
                INSERT INTO items
                (
                    owner_id,
                    name,
                    category,
                    description,
                    price,
                    photo,
                    pickup_area
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `)
            .run(
                owner_id,
                name,
                category || "",
                description || "",
                Number(price) || 0,
                photo || null,
                pickup_area || ""
            );

        const item = db
            .prepare("SELECT * FROM items WHERE id = ?")
            .get(result.lastInsertRowid);

        res.status(201).json({
            success: true,
            item
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to create item"
        });
    }
});

// =========================
// REQUESTS
// =========================

// Get requests
app.get("/api/requests", (req, res) => {
    try {
        const requests = db
            .prepare(`
                SELECT
                    requests.*,
                    items.name AS item_name,
                    requester.name AS requester_name,
                    owner.name AS owner_name
                FROM requests

                JOIN items
                    ON items.id = requests.item_id

                JOIN users AS requester
                    ON requester.id = requests.requester_id

                JOIN users AS owner
                    ON owner.id = requests.owner_id

                ORDER BY requests.id DESC
            `)
            .all();

        res.json({
            success: true,
            requests
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to get requests"
        });
    }
});

// Create request
app.post("/api/requests", (req, res) => {
    try {
        const {
            item_id,
            requester_id,
            owner_id,
            days,
            pickup_spot
        } = req.body;

        if (!item_id || !requester_id || !owner_id || !days) {
            return res.status(400).json({
                success: false,
                message: "Missing required request information"
            });
        }

        const result = db
            .prepare(`
                INSERT INTO requests
                (
                    item_id,
                    requester_id,
                    owner_id,
                    days,
                    pickup_spot
                )
                VALUES (?, ?, ?, ?, ?)
            `)
            .run(
                item_id,
                requester_id,
                owner_id,
                days,
                pickup_spot || ""
            );

        const request = db
            .prepare("SELECT * FROM requests WHERE id = ?")
            .get(result.lastInsertRowid);

        res.status(201).json({
            success: true,
            request
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to create request"
        });
    }
});

// =========================
// MESSAGES
// =========================

app.get("/api/messages/:requestId", (req, res) => {
    try {
        const messages = db
            .prepare(`
                SELECT
                    messages.*,
                    users.name AS sender_name
                FROM messages
                JOIN users
                    ON users.id = messages.sender_id
                WHERE request_id = ?
                ORDER BY messages.id ASC
            `)
            .all(req.params.requestId);

        res.json({
            success: true,
            messages
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to get messages"
        });
    }
});

app.post("/api/messages", (req, res) => {
    try {
        const {
            request_id,
            sender_id,
            message
        } = req.body;

        if (!request_id || !sender_id || !message) {
            return res.status(400).json({
                success: false,
                message: "Request, sender and message are required"
            });
        }

        const result = db
            .prepare(`
                INSERT INTO messages
                (
                    request_id,
                    sender_id,
                    message
                )
                VALUES (?, ?, ?)
            `)
            .run(
                request_id,
                sender_id,
                message
            );

        const newMessage = db
            .prepare(`
                SELECT *
                FROM messages
                WHERE id = ?
            `)
            .get(result.lastInsertRowid);

        res.status(201).json({
            success: true,
            message: newMessage
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to send message"
        });
    }
});

// =========================
// REVIEWS
// =========================

app.post("/api/reviews", (req, res) => {
    try {
        const {
            request_id,
            reviewer_id,
            reviewed_id,
            rating,
            comment
        } = req.body;

        if (
            !request_id ||
            !reviewer_id ||
            !reviewed_id ||
            !rating
        ) {
            return res.status(400).json({
                success: false,
                message: "Required review information is missing"
            });
        }

        const result = db
            .prepare(`
                INSERT INTO reviews
                (
                    request_id,
                    reviewer_id,
                    reviewed_id,
                    rating,
                    comment
                )
                VALUES (?, ?, ?, ?, ?)
            `)
            .run(
                request_id,
                reviewer_id,
                reviewed_id,
                rating,
                comment || ""
            );

        res.status(201).json({
            success: true,
            review_id: result.lastInsertRowid
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to create review"
        });
    }
});

// =========================
// REPORTS
// =========================

app.post("/api/reports", (req, res) => {
    try {
        const {
            reporter_id,
            reported_user_id,
            reported_item_id,
            reason
        } = req.body;

        if (!reporter_id || !reason) {
            return res.status(400).json({
                success: false,
                message: "Reporter and reason are required"
            });
        }

        const result = db
            .prepare(`
                INSERT INTO reports
                (
                    reporter_id,
                    reported_user_id,
                    reported_item_id,
                    reason
                )
                VALUES (?, ?, ?, ?)
            `)
            .run(
                reporter_id,
                reported_user_id || null,
                reported_item_id || null,
                reason
            );

        res.status(201).json({
            success: true,
            report_id: result.lastInsertRowid
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to submit report"
        });
    }
});

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
    console.log("=================================");
    console.log("LOOPA SERVER");
    console.log("=================================");
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("Database connected.");
    console.log("=================================");
});