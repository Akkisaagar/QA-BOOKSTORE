console.log("APP JS LOADED");
window.forgotPassword = function() {
  alert("Function reached");
};
const urlToken =
  new URLSearchParams(window.location.search)
    .get("token");

if (urlToken) {
  localStorage.setItem("token", urlToken);
  localStorage.setItem("apiKey", "Akki@123");

  // Optional: clean URL
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname
  );
}
const token =
  localStorage.getItem("token");

const currentPage =
  window.location.pathname;

if (
  currentPage.includes("dashboard") &&
  !localStorage.getItem("token")
) {
  window.location.href = "login.html";
}
console.log("APP JS LOADED");
const API = "https://qa-bookstore.onrender.com";

/* ================= BOOKS ================= */

async function loadBooks() {
  console.log("BOOKS API KEY:", localStorage.getItem("apiKey"));
console.log("BOOKS TOKEN:", localStorage.getItem("token"));
  try {
    const res = await fetch(API + "/books", {
  headers: {
    "x-api-key": localStorage.getItem("apiKey"),
    "Authorization": "Bearer " + localStorage.getItem("token")
  }
});
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
  console.log("ORDERS API KEY:", localStorage.getItem("apiKey"));
console.log("ORDERS TOKEN:", localStorage.getItem("token"));
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
async function register() {

  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(API + "/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username,
      email,
      password
    })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "Registration failed");
    return;
  }

  alert(data.message);
  window.location.href = "login.html";
}

async function login() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(API + "/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "Login failed");
    return;
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("apiKey", data.apiKey);

  window.location.href = "dashboard.html";
}

window.getProfile = async function () {

  try {

    const res = await fetch(API + "/profile", {
      headers: {
        "x-api-key": localStorage.getItem("apiKey"),
        "Authorization":
          "Bearer " + localStorage.getItem("token")
      }
    });

    const data = await res.json();

    document.getElementById("profileUsername").innerText =
      data.username;

    document.getElementById("profileEmail").innerText =
      data.email;

    document.getElementById("profileRole").innerText =
      data.role;

    document.getElementById("profileModal").style.display =
      "block";

  } catch (err) {
    console.error(err);
    showToast("Failed to load profile", "error");
  }
};

window.closeProfile = function () {
  document.getElementById("profileModal").style.display =
    "none";
};
function googleLogin() {

 window.location.href =
 API + "/auth/google";
}

window.forgotPassword = async function () {

  const email =
    document.getElementById("email").value;

  const res = await fetch(
    API + "/forgot-password",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    }
  );

  const data = await res.json();

  alert(data.message);
};

window.logout = function () {

  if (confirm("Are you sure you want to logout?")) {

    localStorage.clear();

    window.location.href = "login.html";
  }
};
async function loadCurrentUser() {

  try {

    const res = await fetch(
      API + "/profile",
      {
        headers: {
          "x-api-key":
            localStorage.getItem("apiKey"),

          "Authorization":
            "Bearer " +
            localStorage.getItem("token")
        }
      }
    );

    const user =
      await res.json();

    const welcome =
      document.getElementById(
        "welcomeUser"
      );

    if (welcome) {

      welcome.innerText =
        `Welcome, ${user.username}`;
    }

  } catch {}
}
/* ================= INIT ================= */
if (document.getElementById("books")) {

  loadCurrentUser();

  loadBooks();

  loadOrders();
}
