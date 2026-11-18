const registerForm = document.getElementById("registerForm");

const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");

const registerMessage = document.getElementById("loginMessage");

const messageTitle = document.getElementById("messageTitle");
const messageStatus = document.getElementById("messageStatus");
const messageHeading = document.getElementById("messageHeading");
const messageText = document.getElementById("messageText");
const messageIcon = document.getElementById("messageIcon");

const togglePassword = document.getElementById("togglePassword");
const passwordIcon = document.getElementById("passwordIcon");

togglePassword.addEventListener("click", () => {
    const isPasswordHidden = passwordInput.type === "password";

    passwordInput.type = isPasswordHidden ? "text" : "password";

    passwordIcon.classList.add("swap");

    setTimeout(() => {
            passwordIcon.classList.remove("swap");
    }, 100);

    passwordIcon.innerHTML = isPasswordHidden
    ? `<path d="M10.58 10.58a2 2 0 0 0 2.83 2.83"/>
       <path d="M16.68 16.68A10.94 10.94 0 0 1 12 17.5c-5 0-8.5-5.5-8.5-5.5a13.16 13.16 0 0 1 3.17-3.83"/>
       <path d="M9.88 5.08A10.94 10.94 0 0 1 12 4.5c5 0 8.5 5.5 8.5 5.5a13.16 13.16 0 0 1-1.72 2.42"/>
       <path d="m3 3 18 18"/>`
    : `<path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"/>
       <circle cx="12" cy="12" r="3"/>`;
});

function showRegisterMessage(type, heading, description) {

    function updateMessage() {
        registerMessage.className = `login-message show ${type} swap-in`;

        messageTitle.textContent = "SYSTEM NOTIFICATION";
        messageStatus.textContent = type === "success" ? "● ONLINE" : "● ERROR";

        messageHeading.textContent = heading;
        messageText.textContent = description;

        messageIcon.innerHTML = type === "success"
            ? `<path d="m9 12 2 2 4-4"/>
               <circle cx="12" cy="12" r="10"/>`
            : `<path d="M12 9v4"/>
               <path d="M12 17h.01"/>
               <circle cx="12" cy="12" r="10"/>`;
    }

    if (!registerMessage.classList.contains("show")) {
        updateMessage();
        return;
    }

    registerMessage.classList.remove("swap-in");
    registerMessage.classList.add("swap-out");

    function handleExit(event) {
        if (event.animationName !== "notificationExit") return;

        registerMessage.removeEventListener("animationend", handleExit);
        updateMessage();
    }

    registerMessage.addEventListener("animationend", handleExit);
}

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (password !== confirmPasswordInput.value) {
        showRegisterMessage(
            "error",
            "Password mismatch",
            "Your passwords do not match. Please try again."
        );
        return;
    }

    try {
        const response = await fetch("/register", {
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

        const data = await response.json();

        if (!response.ok) {
            showRegisterMessage(
                "error",
                "Registration failed",
                data.message
            );
            return;
        }

        showRegisterMessage(
            "success",
            "Account created!",
            "Your player account is ready. You can now log in."
        );

        setTimeout(() => {
            window.location.href = "/login.html";
        }, 1500);

    } catch (error) {
        console.error("Registration request failed:", error);

        showRegisterMessage(
            "connection-error",
            "Connection failed",
            "Unable to reach the authentication server."
        );
    }
});