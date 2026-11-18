require("dotenv").config();

const express = require("express");
const pool = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs").promises;
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3000;

const blacklistedTokens = new Set();

app.get("/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.send(`Database connected! Server time: ${result.rows[0].now}`);
    } catch (error) {
        console.error("Database connection failed:", error.message);
        res.status(500).send("Database connection failed.");
    }
});

app.post("/register", async (req, res) => {
    try {

    const { username, email, password } = req.body;

        if (
            typeof username !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !email.trim() ||
            !password.trim()
        ) {
            return res.status(400).json({
                message: "Username, email, and password are required."
            });
        }

        if (!isValidEmail(email.trim())) {
            return res.status(400).json({
                message: "Please provide a valid email address."
            });
        }

        if (password.length < 8) {
        return res.status(400).json({
            message: "Password must be at least 8 characters long."
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    const result = await pool.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, username, email, created_at`,
    [cleanUsername, cleanEmail, hashedPassword]
    );

    res.status(201).json({
        message: "User registered successfully!",
        user: result.rows[0]
    });

    } catch (error) {
    if (error.code === "23505") {
        return res.status(409).json({
            message: "Username or email already exists."
        });
    }

    console.error("Registration error:", error.message);

        res.status(500).json({
            message: "Something went wrong during registration."
        });
    }
});

function authenticateToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            message: "Access token is required."
        });
    }

    if (blacklistedTokens.has(token)) {
        return res.status(401).json({
            message: "This token has been logged out."
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (error) {
            return res.status(403).json({
                message: "Invalid or expired token."
            });
        }

        req.user = user;
        next();
    });
}

app.get("/session", authenticateToken, (req, res) => {
    res.json({
        expiresAt: req.user.exp * 1000
    });
});

function authenticateDashboard(req, res, next) {
    const token = req.cookies.token;

    if (!token || blacklistedTokens.has(token)) {
        return res.redirect("/login.html");
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (error) {
            return res.redirect("/login.html");
        }

        req.user = user;
        next();
    });
}

function redirectIfAuthenticated(req, res, next) {
    const token = req.cookies.token;

    if (!token || blacklistedTokens.has(token)) {
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (error) {
            return next();
        }

        return res.redirect("/dashboard");
    });
}

app.get("/dashboard", authenticateDashboard, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT theme FROM users WHERE id = $1",
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).send("User not found.");
        }

        let dashboard = await fs.readFile(
            path.join(__dirname, "public", "dashboard.html"),
            "utf8"
        );

        const theme = result.rows[0].theme === "umr" ? "umr" : "default";

        dashboard = dashboard.replace(
            /(<img\s+id="headerMascot"\s+src=")[^"]+(")/,
            (_, before, after) =>
                `${before}./images/${theme === "umr" ? "UMR.png" : "bear-mascot.png"}${after}`
        );

        dashboard = dashboard.replace(
            /document\.documentElement\.setAttribute\(['"]data-theme['"],\s*['"]default['"]\);/,
            `document.documentElement.setAttribute('data-theme', '${theme}');`
        );

        console.log("Theme injected:", theme);
        console.log("Theme script replaced:", dashboard.includes(
            `setAttribute('data-theme', '${theme}')`
        ));

        res.set({
            "Cache-Control": "no-store, no-cache, must-revalidate, private",
            "Pragma": "no-cache",
            "Expires": "0"
        });

        res.send(dashboard);

    } catch (error) {
        console.error("Dashboard loading error:", error.message);
        res.status(500).send("Unable to load dashboard.");
    }
});

app.get("/", redirectIfAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/login.html", redirectIfAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.use(express.static(path.join(__dirname, "public")));

app.post("/login", async (req, res) => {
    console.log("Login route reached!");

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required."
        });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        console.log("Database query completed!");

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 1000
        });

        res.json({
            message: "Login successful!",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                theme: user.theme
            }
        });

    } catch (error) {
        console.error("Login error:", error.message);

        res.status(500).json({
            message: "Something went wrong during login."
        });
    }
});

app.get("/profile", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, username, email, created_at FROM users WHERE id = $1",
            [req.user.id]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        res.json({
            message: "Welcome to your profile!",
            user: user
        });

    } catch (error) {
        console.error("Profile error:", error.message);

        res.status(500).json({
            message: "Something went wrong loading your profile."
        });
    }
});

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.put("/profile", authenticateToken, async (req, res) => {
    try {
        const { username, email } = req.body;

        if (
            typeof username !== "string" ||
            typeof email !== "string" ||
            !username.trim() ||
            !email.trim()
        ) {
            return res.status(400).json({
                message: "Username and email are required."
            });
        }

        if (!isValidEmail(email.trim())) {
            return res.status(400).json({
                message: "Please provide a valid email address."
            });
        }

        const cleanUsername = username.trim();
        const cleanEmail = email.trim();

        const result = await pool.query(
            `UPDATE users
             SET username = $1, email = $2
             WHERE id = $3
             RETURNING id, username, email, created_at`,
            [cleanUsername, cleanEmail, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        res.json({
            message: "Profile updated successfully.",
            user: result.rows[0]
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "Username or email is already taken."
            });
        }

        console.error("Profile update error:", error.message);

        res.status(500).json({
            message: "Something went wrong updating your profile."
        });
    }
});

app.put("/theme", authenticateToken, async (req, res) => {
    const { theme } = req.body;

    if (!["default", "umr"].includes(theme)) {
        return res.status(400).json({
            message: "Invalid theme selected."
        });
    }

    try {
        await pool.query(
            "UPDATE users SET theme = $1 WHERE id = $2",
            [theme, req.user.id]
        );

        res.json({
            message: "Theme preference updated successfully.",
            theme
        });

    } catch (error) {
        console.error("Theme update error:", error.message);

        res.status(500).json({
            message: "Failed to update theme preference."
        });
    }
});

app.get("/theme", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT theme FROM users WHERE id = $1",
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        res.json({
            theme: result.rows[0].theme
        });

    } catch (error) {
        console.error("Theme retrieval error:", error.message);

        res.status(500).json({
            message: "Failed to retrieve theme preference."
        });
    }
});

app.delete("/profile", authenticateToken, async (req, res) => {
    const token = req.cookies.token;

    try {
        const result = await pool.query(
            "DELETE FROM users WHERE id = $1 RETURNING id",
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        blacklistedTokens.add(token);

        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        res.json({
            message: "Account deleted successfully."
        });

    } catch (error) {
        console.error("Account deletion error:", error.message);

        res.status(500).json({
            message: "Something went wrong deleting your account."
        });
    }
});

app.post("/change-password", authenticateToken, async (req, res) => {

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            message: "Current password and new password are required."
        });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({
            message: "New password must be at least 8 characters long."
        });
    }

    try {
    const result = await pool.query(
        "SELECT password_hash FROM users WHERE id = $1",
        [req.user.id]
    );

    const user = result.rows[0];

        if (!user) {
        return res.status(404).json({
            message: "User not found."
        });
    }

    const passwordMatches = await bcrypt.compare(
        currentPassword,
        user.password_hash
    );

    if (!passwordMatches) {
        return res.status(401).json({
            message: "Current password is incorrect."
        });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
        "UPDATE users SET password_hash = $1 WHERE id = $2",
        [hashedPassword, req.user.id]
    );

    res.json({
        message: "Password changed successfully."
    });

    } catch (error) {
        console.error("Change password error:", error.message);

        res.status(500).json({
            message: "Something went wrong changing the password."
        });
    }
});

app.post("/logout", authenticateToken, (req, res) => {
    const token = req.cookies.token;

    blacklistedTokens.add(token);

    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });

    res.json({
        message: "Logged out successfully."
    });
});

app.listen(PORT, () => {
    console.log(`SkillIssue is running on port ${PORT}`);
});