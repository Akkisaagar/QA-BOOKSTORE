require("dotenv").config();
const passport =
require("passport");

const GoogleStrategy =
require("passport-google-oauth20")
.Strategy;

const session =
require("express-session");
const express = require("express");
const app = express();
app.set("trust proxy", 1);
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
app.use(cors({
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://akashjha.site",
    "https://www.akashjha.site"
  ]
}));
app.use(session({
  secret:"google-login",
  resave:false,
  saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());

/* ================= DATABASE ================= */
console.log("HOST:", process.env.DB_HOST);
console.log("USER:", process.env.DB_USER);
console.log("DB:", process.env.DB_NAME);
console.log("PORT:", process.env.DB_PORT);
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
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
app.post("/login", (req, res) => {

  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, rows) => {

      if (err)
        return res.status(500).json(err);

      if (rows.length === 0)
        return res.status(401).json({
          message: "User not found"
        });

      const user = rows[0];

      const valid =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!valid)
        return res.status(401).json({
          message: "Invalid password"
        });

      const token = jwt.sign(
  {
    id: req.user.id,
    email: req.user.email,
    role: req.user.role
  },
  JWT_SECRET,
  {
    expiresIn: "1h"
  }
);

      res.json({
        token,
        apiKey: API_KEY,
        role: user.role
      });
    }
  );
});
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);
   passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        "https://qa-bookstore.onrender.com/auth/google/callback"
    },
    (accessToken, refreshToken, profile, done) => {

      const email = profile.emails[0].value;
      const username = profile.displayName;

      db.query(
        "SELECT * FROM users WHERE email=?",
        [email],
        (err, rows) => {

          if (err) return done(err);

          if (rows.length > 0) {
            return done(null, rows[0]);
          }

          db.query(
            "INSERT INTO users(username,email,password,role) VALUES(?,?,?,?)",
            [
              username,
              email,
              "GOOGLE_LOGIN",
              "user"
            ],
            (err) => {

              if (err) return done(err);

              db.query(
                "SELECT * FROM users WHERE email=?",
                [email],
                (err, newRows) => {

                  if (err) return done(err);

                  return done(null, newRows[0]);
                }
              );
            }
          );
        }
      );
    }
  )
);
app.get(
  "/google-users",
  apiKeyAuth,
  tokenAuth,
  adminOnly,
  (req, res) => {

    db.query(
      `SELECT id,
              username,
              email,
              role,
              created_at
       FROM users
       WHERE provider='google'`,
      (err, rows) => {

        if (err)
          return res.status(500).json(err);

        res.json(rows);
      }
    );
  }
);
passport.serializeUser(
(user,done)=>done(null,user)
);

passport.deserializeUser(
(user,done)=>done(null,user)
);
app.get(
  "/auth/google",

  passport.authenticate(
    "google",
    {
      scope:[
        "profile",
        "email"
      ]
    }
  )
  ,
app.get(
  "/auth/google/callback",

  passport.authenticate(
    "google",
    {
      failureRedirect: "/login"
    }
  ),

  (req, res) => {
console.log("USER:", req.user);
    console.log("✅ Google login success");
    console.log(req.user);
const token = jwt.sign(
  {
    id: req.user.id,
    email: req.user.email,
    role: req.user.role
  },
  JWT_SECRET,
  {
    expiresIn: "1h"
  }
);

    res.redirect(
      `https://akashjha.site/dashboard.html?token=${token}`
    );
  }
));


app.post("/register", async (req, res) => {

  const { username, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users(username,email,password) VALUES(?,?,?)",
    [username, email, hashedPassword],
    err => {

      if (err)
        return res.status(500).json(err);

      res.json({
        message: "User registered successfully"
      });
    }
  );
});
app.post("/make-admin", (req, res) => {

  db.query(
    "UPDATE users SET role='admin' WHERE email=?",
    [req.body.email],
    err => {

      if (err)
        return res.status(500).json(err);

      res.json({
        message: "User promoted to admin"
      });
    }
  );
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
    ["Java", 10, 10, false],
    ["Manual Testing", 8, 8, false],
    ["Linux", 6, 6, false],
    ["Python", 7, 7, false],
    ["SQL", 5, 5, false]
  ];

  db.query("DELETE FROM orders", err => {
    if (err) return res.status(500).json(err);

    db.query("DELETE FROM books", err => {
      if (err) return res.status(500).json(err);

      db.query(
        "INSERT INTO books (name, stock, initialStock, deleted) VALUES ?",
        [books],
        err => {
          if (err) return res.status(500).json(err);

          logAction("Database reset");

          res.json({
            message: "Database reset successfully"
          });
        }
      );
    });
  });

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
/* =================profile ================= */
app.get("/profile", apiKeyAuth, tokenAuth, (req, res) => {

  db.query(
    "SELECT id, username, email, role, created_at FROM users WHERE id=?",
    [req.user.id],
    (err, rows) => {

      if (err)
        return res.status(500).json(err);

      if (rows.length === 0)
        return res.status(404).json({
          message: "User not found"
        });

      res.json(rows[0]);
    }
  );
});
app.put("/profile", apiKeyAuth, tokenAuth, (req, res) => {

  const { username } = req.body;

  db.query(
    "UPDATE users SET username=? WHERE id=?",
    [username, req.user.id],
    err => {

      if (err)
        return res.status(500).json(err);

      res.json({
        message: "Profile updated"
      });
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
app.get(
  "/users",
  apiKeyAuth,
  tokenAuth,
  adminOnly,
  (req, res) => {

    db.query(
      "SELECT id, username, email, role FROM users",
      (err, rows) => {

        if (err)
          return res.status(500).json(err);

        res.json(rows);
      }
    );
  }
);
app.delete(
  "/users/:id",
  apiKeyAuth,
  tokenAuth,
  adminOnly,
  (req, res) => {

    db.query(
      "DELETE FROM users WHERE id=?",
      [req.params.id],
      err => {

        if (err)
          return res.status(500).json(err);

        res.json({
          message: "User deleted successfully"
        });
      }
    );
  }
);
app.post("/forgot-password", (req, res) => {

  const { email } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, rows) => {

      if (err)
        return res.status(500).json(err);

      if (rows.length === 0)
        return res.status(404).json({
          message: "User not found"
        });

      const token = jwt.sign(
        { email },
        JWT_SECRET,
        { expiresIn: "15m" }
      );

      const resetLink =
        `https://akashjha.site/reset-password.html?token=${token}`;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "QA BookStore Password Reset",
        html: `
          <h2>Password Reset</h2>
          <p>Click below link:</p>
          <a href="${resetLink}">
            Reset Password
          </a>
        `
      });

      res.json({
        message: "Reset email sent"
      });
    }
  );
});
app.post("/reset-password", async (req, res) => {

  const { token, newPassword } = req.body;

  try {

    const decoded =
      jwt.verify(token, JWT_SECRET);

    const hashedPassword =
      await bcrypt.hash(newPassword, 10);

    db.query(
      "UPDATE users SET password=? WHERE email=?",
      [
        hashedPassword,
        decoded.email
      ],
      err => {

        if (err)
          return res.status(500).json(err);

        res.json({
          message: "Password updated successfully"
        });
      }
    );

  } catch {

    res.status(400).json({
      message: "Invalid or expired token"
    });
  }
});


