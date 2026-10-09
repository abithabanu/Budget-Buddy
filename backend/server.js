
console.log("SERVER FILE LOADED");

const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "budgetbuddy",
    port: 3306
});

// DATABASE CONNECTION
db.connect(function (err) {
    if (err) {
        console.log("Database Connection Failed");
        console.log(err.message);
        return;
    }

    console.log("MySQL Connected Successfully");
});

// HOME API
app.get("/", function (req, res) {
    res.send("BudgetBuddy Backend Running");
});

// SIGNUP API
app.post("/signup", function (req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    const checkSql = "SELECT id FROM users WHERE email = ?";

    db.query(checkSql, [email], function (err, result) {
        if (err) {
            console.log("Signup Check Error:", err.message);
            return res.status(500).json({ message: "Server Error" });
        }

        if (result.length > 0) {
            return res.status(409).json({
                message: "Email Already Registered"
            });
        }

        const insertSql = "INSERT INTO users (email, password) VALUES (?, ?)";

        db.query(insertSql, [email, password], function (err, result) {
            if (err) {
                console.log("Signup Insert Error:", err.message);
                return res.status(500).json({ message: "Signup Failed" });
            }

            return res.status(201).json({
                message: "Signup Successful",
                userId: result.insertId
            });
        });
    });
});

// LOGIN API
app.post("/login", function (req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    const sql = "SELECT id, email, password FROM users WHERE email = ?";

    db.query(sql, [email], function (err, result) {
        if (err) {
            console.log("Login Error:", err.message);
            return res.status(500).json({ message: "Login Failed" });
        }

        if (result.length === 0 || result[0].password !== password) {
            return res.status(401).json({
                message: "Invalid Email or Password"
            });
        }

        return res.json({
            message: "Login Successful",
            userId: result[0].id
        });
    });
});

// TEST API
app.get("/test", function (req, res) {
    res.send("BudgetBuddy API is working");
});

// ADD TRANSACTION API
app.post("/addTransaction", function (req, res) {
    const { user_id, type, category, amount, transaction_date } = req.body;

    if (!user_id || !type || !category || amount === undefined || !transaction_date) {
        return res.status(400).json({
            message: "All transaction fields are required"
        });
    }

    const sql =
        "INSERT INTO transactions " +
        "(user_id, type, category, amount, transaction_date) " +
        "VALUES (?, ?, ?, ?, ?)";

    db.query(
        sql,
        [user_id, type, category, amount, transaction_date],
        function (err, result) {
            if (err) {
                console.log("Add Transaction Error:", err.message);
                return res.status(500).json({
                    message: "Transaction Failed"
                });
            }

            return res.status(201).json({
                message: "Transaction Added",
                transactionId: result.insertId
            });
        }
    );
});

// GET TRANSACTIONS API
app.get("/getTransactions/:userId", function (req, res) {
    const userId = req.params.userId;

    const sql =
        "SELECT * FROM transactions " +
        "WHERE user_id = ? " +
        "ORDER BY transaction_date DESC";

    db.query(sql, [userId], function (err, result) {
        if (err) {
            console.log("Fetch Transactions Error:", err.message);
            return res.status(500).json({
                message: "Error Fetching Data"
            });
        }

        return res.json(result);
    });
});

// DELETE TRANSACTION API
app.delete("/deleteTransaction/:id", function (req, res) {
    const transactionId = req.params.id;

    const sql = "DELETE FROM transactions WHERE id = ?";

    db.query(sql, [transactionId], function (err, result) {
        if (err) {
            console.log("Delete Transaction Error:", err.message);
            return res.status(500).json({
                message: "Delete Failed"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Transaction Not Found"
            });
        }

        return res.json({
            message: "Transaction Deleted Successfully"
        });
    });
});

// EDIT TRANSACTION API
app.put("/editTransaction/:id", function (req, res) {
    const transactionId = req.params.id;
    const { type, category, amount, transaction_date } = req.body;

    if (!type || !category || amount === undefined || !transaction_date) {
        return res.status(400).json({
            message: "All transaction fields are required"
        });
    }

    const sql =
        "UPDATE transactions " +
        "SET type = ?, category = ?, amount = ?, transaction_date = ? " +
        "WHERE id = ?";

    db.query(
        sql,
        [type, category, amount, transaction_date, transactionId],
        function (err, result) {
            if (err) {
                console.log("Edit Transaction Error:", err.message);
                return res.status(500).json({
                    message: "Update Failed"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Transaction Not Found or No Changes Made"
                });
            }

            return res.json({
                message: "Transaction Updated Successfully"
            });
        }
    );
});

// START SERVER
app.listen(5000, function () {
    console.log("Server running on Port 5000");
});