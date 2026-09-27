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
    database: "budgetbuddy"
});

db.connect((err) => {
    if (err) {
        console.log("Database Connection Failed");
        throw err;
    }

    console.log("✅ MySQL Connected Successfully");
});

app.get("/", (req, res) => {
    res.send("🚀 BudgetBuddy Backend Running");
});

/* SIGNUP API */

app.post("/signup", (req, res) => {

    const { email, password } = req.body;

    app.post("/signup", (req, res) => {

    const { email, password } = req.body;

    const checkSql =
    "SELECT * FROM users WHERE email=?";

    db.query(checkSql,[email],(err,result)=>{

        if(err){
            return res.status(500).json({
                message:"Server Error"
            });
        }

        if(result.length > 0){

            return res.json({
                message:"Email Already Registered"
            });
        }

        const insertSql =
        "INSERT INTO users(email,password) VALUES(?,?)";

        db.query(insertSql,[email,password],(err)=>{

            if(err){

                return res.status(500).json({
                    message:"Signup Failed"
                });
            }

            res.json({
                message:"Signup Successful"
            });

        });

    });

});

    db.query(sql, [email, password], (err, result) => {

        if(err){
            return res.status(500).json({
                message: "Signup Failed"
            });
        }

        res.json({
            message: "Signup Successful"
        });

    });

});

/* LOGIN API */

app.post("/login", (req, res) => {

    const { email, password } = req.body;

    const sql =
    "SELECT * FROM users WHERE email=? AND password=?";

    db.query(sql, [email, password], (err, result) => {

        if(err){
            return res.status(500).json({
                message: "Login Failed"
            });
        }

        if(result.length > 0){

            res.json({
                message: "Login Successful",
                userId: result[0].id
            });

        }else{

            res.status(401).json({
                message: "Invalid Email or Password"
            });
        }
    });
});

app.get("/test", (req, res) => {
    res.send("Login Route Version");
});

app.post("/addTransaction", (req, res) => {

    const {
        user_id,
        type,
        category,
        amount,
        transaction_date
    } = req.body;

    const sql = `
    INSERT INTO transactions
    (user_id,type,category,amount,transaction_date)
    VALUES (?,?,?,?,?)
    `;

    db.query(
        sql,
        [
            user_id,
            type,
            category,
            amount,
            transaction_date
        ],
        (err,result)=>{

            if(err){

                return res.status(500).json({
                    message:"Transaction Failed"
                });
            }

            res.json({
                message:"Transaction Added"
            });
        }
    );

});

app.get("/getTransactions/:userId", (req,res)=>{

    const userId =
    req.params.userId;

    const sql =
    "SELECT * FROM transactions WHERE user_id=?";

    db.query(sql,[userId],(err,result)=>{

        if(err){

            return res.status(500).json({
                message:"Error Fetching Data"
            });
        }

        res.json(result);

    });

});

app.listen(5000, () => {
    console.log("🚀 Server running on Port 5000");
});