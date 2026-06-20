const API = "https://qa-bookstore.onrender.com";

async function login() {

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

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
    alert(data.message);
    return;
  }

  localStorage.setItem(
    "token",
    data.token
  );

  localStorage.setItem(
    "apiKey",
    data.apiKey
  );

  window.location.href =
    "dashboard.html";
}

async function register() {

  const username =
    document.getElementById("username").value;

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  const res = await fetch(
    API + "/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        email,
        password
      })
    }
  );
  

  const data = await res.json();

  alert(data.message);

  window.location.href =
    "login.html";
}

function togglePassword() {

  const pwd =
    document.getElementById("password");

  pwd.type =
    pwd.type === "password"
      ? "text"
      : "password";
}
function googleLogin() {

  window.location.href =
    API + "/auth/google";
}