let isSignup = false;

function toggleMode() {
  isSignup = !isSignup;
  document.getElementById("form-title").textContent = isSignup
    ? "Sign Up"
    : "Sign In";
  document.getElementById("submit-button").textContent = isSignup
    ? "Sign Up"
    : "Sign In";
  document.querySelector(".auth-switch").innerHTML = isSignup
    ? `Already have an account? <a onclick="toggleMode()">Sign In</a>`
    : `Don't have an account? <a onclick="toggleMode()">Sign Up</a>`;
}

function handleAuth(event) {
  event.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        localStorage.setItem("token", data.token);
        window.location.href = "/";
      }
    });
}
