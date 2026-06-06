const API = "https://qa-bookstore.onrender.com";

/* ================= BOOKS ================= */
async function loadBooks() {
  try {
    const res = await fetch(API + "/books");
    const data = await res.json();

    const booksEl = document.getElementById("books");

    if (!data || data.length === 0) {
      booksEl.innerHTML = "<p>No books available</p>";
      return;
    }

    booksEl.innerHTML = data
      .map(b => `
        <div class="book-row">
          <img src="https://cdn-icons-png.flaticon.com/512/29/29302.png" />
         <b>${b.id}. ${b.name}</b>
<span style="margin-left:10px;">Stock: ${b.stock}</span>

        </div>
      `)
      .join("");
  } catch (err) {
    showToast("Failed to load books", "error");
  }
}

/* ================= ORDERS ================= */
async function loadOrders() {
  try {
    const res = await fetch(API + "/orders", {
      headers: {
        "x-api-key": localStorage.getItem("apiKey"),
        "Authorization": "Bearer " + localStorage.getItem("token")
      }
    });

    const data = await res.json();
    const ordersEl = document.getElementById("orders");

    if (!data || data.length === 0) {
      ordersEl.innerHTML = "<li>No orders</li>";
      return;
    }

    ordersEl.innerHTML = data
      .map(o => `<li>#${o.id} - ${o.bookName}</li>`)
      .join("");
  } catch (err) {
    showToast("Failed to load orders", "error");
  }
}

/* ================= TOAST ================= */
function showToast(message, type) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.className = type === "success" ? "toast-success" : "toast-error";
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

/* ================= ORDER BOOK ================= */
async function orderBook() {
  const id = document.getElementById("bookId").value;

  if (!id) {
    showToast("Please enter Book ID", "error");
    return;
  }

  try {
    const res = await fetch(API + "/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": localStorage.getItem("apiKey"),
        "Authorization": "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify({ bookId: Number(id) })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Order failed", "error");
      return;
    }

    showToast("Order placed successfully!", "success");
    document.getElementById("bookId").value = "";

    loadBooks();
    loadOrders();
  } catch (err) {
    showToast("Server error while ordering", "error");
  }
}

/* ================= RESET DATABASE ================= */
async function resetDB() {
  try {
    const res = await fetch(API + "/reset", {
      method: "POST",
      headers: {
        "x-api-key": localStorage.getItem("apiKey"),
        "Authorization": "Bearer " + localStorage.getItem("token")
      }
    });

    const data = await res.json();
    showToast(data.message, "success");

    loadBooks();
    loadOrders();
  } catch (err) {
    showToast("Reset failed", "error");
  }
}

/* ================= AUTO LOGIN ================= */
async function autoLogin() {
  try {
    const res = await fetch(API + "/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "qa",
        password: "test"
      })
    });

    const data = await res.json();

    localStorage.setItem("token", data.token);
    localStorage.setItem("apiKey", data.apiKey);

    loadBooks();
    loadOrders();
  } catch (err) {
    showToast("Login failed", "error");
  }
}

/* ================= INIT ================= */
autoLogin();
