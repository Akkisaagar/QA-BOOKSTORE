const express = require("express");
const cors = require("cors");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const SECRET = "QA_SUPER_SECRET";
const API_KEY = "Akki@123";

const app = express();
app.use(cors());
app.use(express.json());

// ================= AUTH MIDDLEWARE =================
function apiKeyAuth(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== API_KEY) {
    return res.status(401).json({ message: "Invalid API Key" });
  }
  next();
}

function tokenAuth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(403).json({ message: "Token missing" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// ================= DATA =================
const DATA_FILE = "./data.json";

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function logAction(action) {
    const data = readData()

    if (!data.logs) {
        data.logs = []
    }

    data.logs.push({
        ...action,
        time: new Date().toISOString()
    })

    writeData(data)
}


// ================= AUTH API =================
app.post("/auth", (req, res) => {
  const { username, password } = req.body;

  if (username === "qa" && password === "test") {
    const token = jwt.sign(
      { user: "qa", role: "admin" },
      SECRET,
      { expiresIn: "15m" }
    );

    return res.json({
      apiKey: API_KEY,
      token: token
    });
  }

  res.status(401).json({ message: "Invalid credentials" });
});

// ================= PUBLIC APIs =================
app.get("/books", (req, res) => {
  const data = readData();
  res.json(data.books.filter(b => !b.deleted));
});

app.get("/health", (req, res) => {
  res.json({ status: "UP" });
});

// ================= PROTECTED APIs =================

// Add book (Admin)
app.post("/books", apiKeyAuth, tokenAuth, adminOnly, (req, res) => {
  const data = readData();

  const newBook = {
    id: data.books.length + 1,
    name: req.body.name,
    stock: req.body.stock,
    initialStock: req.body.stock,
    deleted: false
  };

  data.books.push(newBook);
  logAction("Book added: " + newBook.name);
  writeData(data);

  res.status(201).json(newBook);
});

// Create order
app.post("/orders", apiKeyAuth, tokenAuth, (req, res) => {
  const data = readData();

  if (!req.body || !req.body.bookId) {
    return res.status(400).json({ message: "bookId is required" });
  }

  const book = data.books.find(b => b.id == req.body.bookId && !b.deleted);

  if (!book) return res.status(404).json({ message: "Book not found" });
  if (book.stock <= 0) return res.status(400).json({ message: "Out of stock" });

  book.stock--;

  const order = {
    id: data.orders.length + 1,
    bookId: book.id,
    bookName: book.name
  };

  data.orders.push(order);
  logAction("Order created for: " + book.name);
  writeData(data);

  res.status(201).json(order);
});

// Get orders
app.get("/orders", apiKeyAuth, tokenAuth, (req, res) => {
  const data = readData();
  res.json(data.orders);
});

// Delete order (Admin)
app.delete("/orders/:id", apiKeyAuth, tokenAuth, adminOnly, (req, res) => {
  const data = readData();
  const index = data.orders.findIndex(o => o.id == req.params.id);

  if (index === -1) return res.status(404).json({ message: "Order not found" });

  const removed = data.orders[index];
  data.orders.splice(index, 1);
  logAction("Order deleted: " + removed.bookName);
  writeData(data);

  res.json({ message: "Order deleted" });
});

// Soft delete book
app.delete("/books/:id", apiKeyAuth, tokenAuth, adminOnly, (req, res) => {
  const data = readData();
  const book = data.books.find(b => b.id == req.params.id);

  if (!book) return res.status(404).json({ message: "Book not found" });

  book.deleted = true;
  logAction("Book soft deleted: " + book.name);
  writeData(data);

  res.json({ message: "Book soft deleted" });
});

// Logged-in user
app.get("/me", apiKeyAuth, tokenAuth, (req, res) => {
  res.json(req.user);
});

// Smart Reset (Preserve books)
app.post("/reset", apiKeyAuth, tokenAuth, adminOnly, (req, res) => {
  const data = readData();

  data.books.forEach(b => {
    if (!b.deleted) {
      b.stock = b.initialStock;
    }
  });

  data.orders = [];
  logAction("System reset executed");
  writeData(data);

  res.json({ message: "Database reset (Books preserved)" });
});

// Audit logs
app.get("/audit", apiKeyAuth, tokenAuth, adminOnly, (req, res) => {
  const data = readData();
  res.json(data.audit);
});

// CSV Import (JSON array)
app.post("/import", apiKeyAuth, tokenAuth, adminOnly, (req, res) => {
  const data = readData();
  const rows = req.body;

  rows.forEach(r => {
    data.books.push({
      id: data.books.length + 1,
      name: r.name,
      stock: parseInt(r.stock),
      initialStock: parseInt(r.stock),
      deleted: false
    });
  });

  logAction("CSV import executed");
  writeData(data);

  res.json({ message: "Books imported successfully" });
});

// ================= START =================
app.listen(3000, () => console.log("Server running on http://localhost:3000"));

