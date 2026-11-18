const playerUsername = document.getElementById("playerUsername");
const playerEmail = document.getElementById("playerEmail");
const memberSince = document.getElementById("memberSince");

const profileView = document.getElementById("profileView");
const welcomeUsername = document.getElementById("welcomeUsername");

const editProfileButton = document.getElementById("editProfileButton");
const editProfileForm = document.getElementById("editProfileForm");
const cancelEditButton = document.getElementById("cancelEditButton");

const editUsername = document.getElementById("editUsername");
const editEmail = document.getElementById("editEmail");

const currentPassword = document.getElementById("currentPassword");
const newPassword = document.getElementById("newPassword");
const passwordMessage = document.getElementById("passwordMessage");

const dashboardTab = document.getElementById("dashboardTab");
const profileTab = document.getElementById("profileTab");
const securityTab = document.getElementById("securityTab");
const settingsTab = document.getElementById("settingsTab");

const dashboardSection = document.getElementById("dashboardSection");
const profileSection = document.getElementById("profileSection");
const securitySection = document.getElementById("securitySection");
const settingsSection = document.getElementById("settingsSection");

const profilePanel = document.getElementById("profilePanel");
const securityPanel = document.getElementById("securityPanel");

const daysActive = document.getElementById("daysActive");
const profileStatus = document.getElementById("profileStatus");
const accountStatus = document.getElementById("accountStatus");
const securityStatus = document.getElementById("securityStatus");

const logoutButton = document.getElementById("logoutButton");

function switchTab(section, tab) {

    // Hide all sections
    dashboardSection.classList.add("hidden");
    profileSection.classList.add("hidden");
    securitySection.classList.add("hidden");
    settingsSection.classList.add("hidden");

    // Show selected section
    section.classList.remove("hidden");

    // Reset navigation styles
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("bg-[#FCE8D2]", "text-[#D97706]");
        item.classList.add("hover:bg-[#E5E3D6]");
    });

    // Highlight active tab
    tab.classList.remove("hover:bg-[#E5E3D6]");
    tab.classList.add("bg-[#FCE8D2]", "text-[#D97706]");
}

dashboardTab.addEventListener("click", (event) => {
    event.preventDefault();
    switchTab(dashboardSection, dashboardTab);
    closeMobileSidebar();
});

profileTab.addEventListener("click", (event) => {
    event.preventDefault();
    switchTab(profileSection, profileTab);
    closeMobileSidebar();
});

securityTab.addEventListener("click", (event) => {
    event.preventDefault();
    switchTab(securitySection, securityTab);
    closeMobileSidebar();
});

settingsTab.addEventListener("click", (event) => {
    event.preventDefault();
    switchTab(settingsSection, settingsTab);
    closeMobileSidebar();
});

async function loadPlayerProfile() {
    try {
        const response = await fetch("/profile");
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                window.location.href = "/login.html";
                return;
            }

            throw new Error(data.message);
        }
        accountStatus.textContent = "Active";
        securityStatus.textContent = "Protected";

        playerUsername.textContent = data.user.username;
        playerEmail.textContent = data.user.email;
        const isProfileComplete =
        Boolean(data.user.username?.trim() && data.user.email?.trim());

        profileStatus.textContent = isProfileComplete ? "Complete" : "Incomplete";

        welcomeUsername.textContent = data.user.username;
        document.getElementById("summaryUsername").textContent = data.user.username;
        welcomeUsername.classList.remove("welcome-username");
        void welcomeUsername.offsetWidth;
        welcomeUsername.classList.add("welcome-username");

        const joinDate = new Date(data.user.created_at);

        const today = new Date();

        const days = Math.floor(
            (today - joinDate) / (1000 * 60 * 60 * 24)
        );

        animateCount(daysActive, days);

        memberSince.textContent = joinDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        document.getElementById("summaryMemberSince").textContent =
            memberSince.textContent;

    } catch (error) {
        console.error("Profile loading error:", error);
    }
}

function animateCount(element, target) {
    let current = 0;

    const duration = Math.min(1000 + target * 2, 2000);
    const startTime = performance.now();

    function updateCount(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        current = Math.floor(progress * target);

        element.textContent = current.toLocaleString("en-US");

        if (progress < 1) {
            requestAnimationFrame(updateCount);
        } else {
            element.textContent = target.toLocaleString("en-US");
        }
    }

    requestAnimationFrame(updateCount);
}

loadPlayerProfile();

editProfileButton.addEventListener("click", () => {
    editUsername.value = playerUsername.textContent;
    editEmail.value = playerEmail.textContent;

    profileMessage.textContent = "";
    profileMessage.classList.add("hidden");

    profileView.classList.add("hidden");
    editProfileForm.classList.remove("hidden");

    editProfileForm.classList.remove("animate-fade-up");
    void editProfileForm.offsetWidth;
    editProfileForm.classList.add("animate-fade-up");
});

cancelEditButton.addEventListener("click", () => {
    editProfileForm.reset();
    editProfileForm.classList.add("hidden");
    profileView.classList.remove("hidden");

    profileView.classList.remove("animate-fade-up");
    void profileView.offsetWidth;
    profileView.classList.add("animate-fade-up");

    profileMessage.textContent = "";
    profileMessage.classList.add("hidden");
});

const profileMessage = document.getElementById("profileMessage");

editProfileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = editUsername.value.trim();
    const email = editEmail.value.trim();

    try {
        const response = await fetch("/profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        playerUsername.textContent = data.user.username;
        playerEmail.textContent = data.user.email;
        welcomeUsername.textContent = data.user.username;

        welcomeUsername.classList.remove("welcome-username");
        void welcomeUsername.offsetWidth;
        welcomeUsername.classList.add("welcome-username");

        profileMessage.textContent = data.message;
        profileMessage.className = "mt-3 text-sm profile-message-success animate-notification";

        editProfileForm.reset();
        editProfileForm.classList.add("hidden");
        profileView.classList.remove("hidden");

        profileView.classList.remove("animate-fade-up");
        void profileView.offsetWidth;
        profileView.classList.add("animate-fade-up");

    } catch (error) {
        profileMessage.textContent = error.message;
        profileMessage.className = "mt-3 text-sm text-red-600 animate-notification";
    }
});

const changePasswordButton = document.getElementById("changePasswordButton");
const changePasswordForm = document.getElementById("changePasswordForm");
const cancelPasswordButton = document.getElementById("cancelPasswordButton");


changePasswordButton.addEventListener("click", () => {
    passwordMessage.textContent = "";
    passwordMessage.classList.add("hidden");

    changePasswordForm.classList.add("password-form-open");
    changePasswordForm.style.maxHeight =
        changePasswordForm.scrollHeight + "px";
});

cancelPasswordButton.addEventListener("click", () => {
    changePasswordForm.style.maxHeight = "0px";
    changePasswordForm.classList.remove("password-form-open");

    setTimeout(() => {
        changePasswordForm.reset();

        currentPassword.type = "password";
        newPassword.type = "password";

        toggleCurrentPassword.innerHTML =
            '<i data-lucide="eye" class="w-5 h-5"></i>';

        toggleNewPassword.innerHTML =
            '<i data-lucide="eye" class="w-5 h-5"></i>';

        lucide.createIcons();
    }, 350);

    passwordMessage.textContent = "";
    passwordMessage.classList.add("hidden");
});

changePasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        const response = await fetch("/change-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                currentPassword: currentPassword.value,
                newPassword: newPassword.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        passwordMessage.textContent = data.message;
        passwordMessage.className = "mt-3 text-sm security-message-success animate-notification";

        passwordMessage.classList.remove("animate-notification");
        void passwordMessage.offsetWidth;
        passwordMessage.classList.add("animate-notification");

        changePasswordForm.reset();

        currentPassword.type = "password";
        newPassword.type = "password";

        toggleCurrentPassword.innerHTML =
            '<i data-lucide="eye" class="w-5 h-5"></i>';

        toggleNewPassword.innerHTML =
            '<i data-lucide="eye" class="w-5 h-5"></i>';

        lucide.createIcons();

        changePasswordForm.classList.add("hidden");

    } catch (error) {
        passwordMessage.textContent = error.message;
        passwordMessage.className = "mt-3 text-sm security-message-error animate-notification";

        passwordMessage.classList.remove("animate-notification");
        void passwordMessage.offsetWidth;
        passwordMessage.classList.add("animate-notification");
    }
});

const deleteAccountButton = document.getElementById("deleteAccountButton");
const deleteAccountConfirmation = document.getElementById("deleteAccountConfirmation");
const confirmDeleteAccount = document.getElementById("confirmDeleteAccount");
const cancelDeleteAccount = document.getElementById("cancelDeleteAccount");
const deleteAccountMessage = document.getElementById("deleteAccountMessage");

// Show confirmation
deleteAccountButton.addEventListener("click", () => {
    deleteAccountConfirmation.classList.add("delete-confirmation-open");
});

// Cancel deletion
cancelDeleteAccount.addEventListener("click", () => {
    deleteAccountConfirmation.classList.remove("delete-confirmation-open");
});

// Confirm deletion
confirmDeleteAccount.addEventListener("click", async () => {
    try {
        const response = await fetch("/profile", {
            method: "DELETE"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        document.body.classList.add("page-exit");

        setTimeout(() => {
            window.location.href = "/login.html";
        }, 400);

    } catch (error) {
        console.error("Account deletion error:", error);

        deleteAccountMessage.textContent =
            error.message || "Something went wrong deleting your account.";

        deleteAccountMessage.className = "mt-3 text-sm security-message-error";
    }
});

logoutButton.addEventListener("click", async () => {
    try {
        const response = await fetch("/logout", {
            method: "POST"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        document.body.classList.add("page-exit");

        setTimeout(() => {
            window.location.href = "/login.html";
        }, 400);
        
    } catch (error) {
        console.error("Logout error:", error);
    }
});

const toggleCurrentPassword = document.getElementById("toggleCurrentPassword");

toggleCurrentPassword.addEventListener("click", () => {
    const isPasswordHidden = currentPassword.type === "password";

    currentPassword.type = isPasswordHidden ? "text" : "password";

    toggleCurrentPassword.innerHTML = isPasswordHidden
        ? '<i data-lucide="eye-off" class="w-5 h-5"></i>'
        : '<i data-lucide="eye" class="w-5 h-5"></i>';

    lucide.createIcons();
});

const toggleNewPassword = document.getElementById("toggleNewPassword");

toggleNewPassword.addEventListener("click", () => {
    const isPasswordHidden = newPassword.type === "password";

    newPassword.type = isPasswordHidden ? "text" : "password";

    toggleNewPassword.innerHTML = isPasswordHidden
        ? '<i data-lucide="eye-off" class="w-5 h-5"></i>'
        : '<i data-lucide="eye" class="w-5 h-5"></i>';

    lucide.createIcons();
});

const dashboardSidebar = document.getElementById("dashboardSidebar");
const sidebarToggle = document.getElementById("sidebarToggle");

sidebarToggle.addEventListener("click", () => {
    dashboardSidebar.classList.toggle("sidebar-collapsed");

    const isCollapsed = dashboardSidebar.classList.contains("sidebar-collapsed");

    sidebarToggle.innerHTML = isCollapsed
        ? '<i data-lucide="panel-left-open" class="w-5 h-5"></i>'
        : '<i data-lucide="panel-left-close" class="w-5 h-5"></i>';

    sidebarToggle.setAttribute(
        "aria-label",
        isCollapsed ? "Expand sidebar" : "Collapse sidebar"
    );

    sidebarToggle.title = isCollapsed ? "Expand sidebar" : "Collapse sidebar";

    lucide.createIcons();
});

// Mobile Sidebar
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileSidebarBackdrop = document.getElementById("mobileSidebarBackdrop");

function closeMobileSidebar() {
    dashboardSidebar.classList.remove("mobile-sidebar-open");
    mobileSidebarBackdrop.classList.remove("mobile-backdrop-open");

    mobileMenuButton.innerHTML =
        '<i data-lucide="menu" class="w-5 h-5"></i>';

    mobileMenuButton.setAttribute("aria-label", "Open navigation menu");

    lucide.createIcons();
}

mobileMenuButton.addEventListener("click", () => {
    dashboardSidebar.classList.add("mobile-sidebar-open");
    mobileSidebarBackdrop.classList.add("mobile-backdrop-open");

});

mobileSidebarBackdrop.addEventListener("click", closeMobileSidebar);

window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) {
        closeMobileSidebar();
    }
});

// ==========================================
// SESSION EXPIRATION TIMER
// ==========================================

async function initializeSessionTimer() {
    const notification = document.getElementById("sessionExpiryNotification");
    const countdown = document.getElementById("sessionCountdown");
    const progress = document.getElementById("sessionProgress");

    let countdownInterval;
    let warningTimeout;

    try {
        const response = await fetch("/session");

        if (!response.ok) {
            window.location.href = "/login.html";
            return;
        }

        const data = await response.json();
        const expiresAt = data.expiresAt;

        const warningDuration = 20 * 1000;
        const warningAt = expiresAt - warningDuration;

        function updateCountdown() {
            const remaining = expiresAt - Date.now();

            if (remaining <= 0) {
                clearInterval(countdownInterval);
                window.location.href = "/login.html";
                return;
            }

            const seconds = Math.ceil(remaining / 1000);

            countdown.textContent = `00:${String(seconds).padStart(2, "0")}`;

            const percentage = Math.min(
                (remaining / warningDuration) * 100,
                100
            );

            progress.style.width = `${percentage}%`;
        }

        function showExpirationWarning() {
            notification.hidden = false;

            updateCountdown();

            countdownInterval = setInterval(updateCountdown, 250);
        }

        const delayUntilWarning = warningAt - Date.now();

        if (delayUntilWarning <= 0) {
            showExpirationWarning();
        } else {
            warningTimeout = setTimeout(
                showExpirationWarning,
                delayUntilWarning
            );
        }

    } catch (error) {
        console.error("Session timer initialization failed:", error);
    }
}

initializeSessionTimer();