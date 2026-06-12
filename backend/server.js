const express = require("express");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: [
    "https://akashjha.site",
    "https://www.akashjha.site"
  ]
}));
app.use(bodyParser.json());

/* ================= DATABASE ================= */

const db = mysql.createConnection({
  host: "localhost",
  user: "akash",
  password: "Akashjha",
  database: "qa_bookstore"
});

db.connect(err => {
  if (err) {
    console.error("❌ DB Connection Failed:", err);
    process.exit(1);
  }
  console.log("✅ MySQL Connected");
});

/* ================= CONFIG ================= */

const JWT_SECRET = "qa-bookstore-secret";
const API_KEY = "Akki@123";

/* ================= MIDDLEWARE ================= */

function apiKeyAuth(req, res, next) {
  if (req.headers["x-api-key"] !== API_KEY) {
    return res.status(403).json({ message: "Invalid API key" });
  }
  next();
}

function tokenAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

/* ================= UTIL ================= */

function logAction(action) {
  db.query("INSERT INTO audit_logs (action) VALUES (?)", [action]);
}

/* ================= AUTH ================= */

app.post("/auth", (req, res) => {
  const { username } = req.body;

  // default admin user
  const role = "admin";

  const token = jwt.sign(
    { username, role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({
    apiKey: API_KEY,
    token
  });
});


/* ================= BOOKS ================= */

// ✅ GET BOOKS (ONLY ACTIVE)
app.get("/books", apiKeyAuth, tokenAuth, (req, res) => {
  db.query(
    "SELECT * FROM books WHERE deleted = false",
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

// ➕ ADD BOOK (ADMIN)
app.post("/books", apiKeyAuth, tokenAuth, adminOnly, (req, res) => {
  const { name, stock } = req.body;

  db.query(
    "INSERT INTO books (name, stock, deleted) VALUES (?, ?, false)",
    [name, stock],
    err => {
      if (err) return res.status(500).json(err);

      logAction(`Book added: ${name}`);
      res.status(201).json({ message: "Book added" });
    }
  );
});

// 🗑️ SOFT DELETE BOOK
app.delete("/books/:id", apiKeyAuth, tokenAuth, adminOnly, (req, res) => {
  db.query(
    "UPDATE books SET deleted = true WHERE id = ?",
    [req.params.id],
    err => {
      if (err) return res.status(500).json(err);

      logAction(`Book soft deleted: ${req.params.id}`);
      res.json({ message: "Book soft deleted" });
    }
  );
});

/* ================= ORDERS ================= */

// 📦 GET ORDERS
app.get("/orders", apiKeyAuth, tokenAuth, (req, res) => {
  db.query("SELECT * FROM orders", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// 🛒 CREATE ORDER (STOCK ↓ IN MYSQL)
app.post("/orders", apiKeyAuth, tokenAuth, (req, res) => {
  const { bookId } = req.body;

  db.query(
    "SELECT * FROM books WHERE id=? AND deleted=false",
    [bookId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0)
        return res.status(404).json({ message: "Book not found" });

      const book = results[0];

      if (book.stock <= 0)
        return res.status(400).json({ message: "Out of stock" });

      // Insert order
      db.query(
        "INSERT INTO orders (bookName) VALUES (?)",
        [book.name],
        err => {
          if (err) return res.status(500).json(err);

          // 🔥 UPDATE STOCK IN MYSQL
          db.query(
            "UPDATE books SET stock = stock - 1 WHERE id=?",
            [bookId]
          );

          logAction(`Order placed for ${book.name}`);
          res.status(201).json({ message: "Order placed" });
        }
      );
    }
  );
});

// ❌ DELETE ORDER (ADMIN)
app.delete("/orders/:id", apiKeyAuth, tokenAuth, adminOnly, (req, res) => {
  db.query(
    "DELETE FROM orders WHERE id = ?",
    [req.params.id],
    err => {
      if (err) return res.status(500).json(err);

      logAction(`Order deleted: ${req.params.id}`);
      res.json({ message: "Order deleted" });
    }
  );
});

/* ================= RESET DATABASE ================= */

app.post("/reset", apiKeyAuth, tokenAuth, adminOnly, (req, res) => {
 const books = [
  ["Java", 10, false],
  ["Manual Testing", 8, false],
  ["Linux", 6, false],
  ["Python", 7, false],
  ["SQL", 5, false]

  ];

  db.query("DELETE FROM orders");
  db.query("DELETE FROM books");

  db.query(
    "INSERT INTO books (name, stock, deleted) VALUES ?",
    [books],
    err => {
      if (err) return res.status(500).json(err);

      logAction("Database reset");
      res.json({ message: "Database reset successfully" });
    }
  );
});

/* ================= AUDIT ================= */

app.get("/audit", apiKeyAuth, tokenAuth, adminOnly, (req, res) => {
  db.query(
    "SELECT * FROM audit_logs ORDER BY id DESC",
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

/* ================= USER ================= */

app.get("/me", apiKeyAuth, tokenAuth, (req, res) => {
  res.json(req.user);
});

/* ================= START ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});