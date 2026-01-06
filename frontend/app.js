const API = "http://localhost:3000";

function loadBooks() {
  fetch(API + "/books")
    .then(res => res.json())
    .then(data => {
      document.getElementById("books").innerHTML =
        data.map(b =>
          `<div class="book-row">
            <img src="https://cdn-icons-png.flaticon.com/512/29/29302.png">
            <b>${b.id}. ${b.name}</b> (Stock: ${b.stock})
          </div>`
        ).join("");
    });
}

function loadOrders() {
  fetch(API + "/orders", {
    headers: {
      "x-api-key": localStorage.getItem("apiKey"),
      "Authorization": "Bearer " + localStorage.getItem("token")
    }
  })
  .then(res => res.json())
  .then(data => {
    const ordersEl = document.getElementById("orders");
    if (!data || data.length === 0) {
      ordersEl.innerHTML = "<li>No orders</li>";
    } else {
      ordersEl.innerHTML =
        data.map(o => `<li>${o.id} - ${o.bookName}</li>`).join("");
    }
  });
}

function showToast(message, type) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.className = type === "success" ? "toast-success" : "toast-error";
  toast.style.display = "block";
  setTimeout(() => toast.style.display = "none", 3000);
}

function orderBook() {
  const id = document.getElementById("bookId").value;

  if (!id) {
    showToast("Please enter Book ID", "error");
    return;
  }

  fetch(API + "/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": localStorage.getItem("apiKey"),
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify({ bookId: parseInt(id) })
  })
  .then(async res => {
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message, "error");
      return;
    }
    showToast("Order placed!", "success");
    document.getElementById("bookId").value = "";
    loadBooks();
    loadOrders();
  });
}

// Auto login
fetch(API + "/auth", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "qa", password: "test" })
})
.then(res => res.json())
.then(data => {
  localStorage.setItem("token", data.token);
  localStorage.setItem("apiKey", data.apiKey);
  loadBooks();
  loadOrders();
});
function resetDB() {
  fetch(API + "/reset", {
    method: "POST",
    headers: {
      "x-api-key": localStorage.getItem("apiKey"),
      "Authorization": "Bearer " + localStorage.getItem("token")
    }
  })
  .then(res => res.json())
  .then(data => {
    showToast(data.message, "success");
    loadBooks();
    loadOrders();
  });
}

