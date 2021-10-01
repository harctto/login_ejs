const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nodelogin'
});

const app = express();
app.set("views", path.join(__dirname, 'views'));
app.set("view engine", 'ejs');

app.use(
    session({
        secret: "secret",
        resave: true,
        saveUninitialized: true
    })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/login", function (req, res) {
    res.sendFile(path.join(__dirname + "/login.html"));
});

app.post('/auth', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;

    if (username && password) {
        connection.query(
            "SELECT * FROM accounts WHERE username = ? AND password = ?",
            [username, password],
            function (err, result, fields) {
                if (result.length > 0) {
                    req.session.loggedin = true;
                    req.session.username = username;
                    res.redirect('/webboard');
                } else {
                    res.send('Incorrent Username and/or Password');
                }
                res.end();
            }
        );
    } else {
        res.send("Please enter Username and Password");
        res.end();
    }
});

app.get("/home", (req, res) => {
    if (req.session.loggedin) {
        res.send("Welcome back, " + req.session.username + "!");
        //response.redirect("/webboard");
    } else {
        res.send("Please login to view this page!");
    }
    res.end();
});

app.get("/signout", (req, res) => {
    req.session.destroy(function (err) {
        res.send("Signout ready!");
        res.end();
    });
});

app.get("/webboard", (req, res) => {
    if (req.session.loggedin)
        connection.query("SELECT * FROM accounts", (err, result) => {
            res.render("index.ejs", {
                posts: result,
            });
            console.log(result);
        });
    else res.send("You must to login First!!!");
    console.log("You must to login First!!!");
    // res.end();
});

app.get("/add", (req, res) => {
    res.render("add");
});

app.post("/add", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    const post = {
        username: username,
        password: password,
        email: email,
    };
    if (req.session.loggedin)
        connection.query("INSERT INTO accounts SET ?", post, (err) => {
            console.log("Data Inserted");
            return res.redirect("/webboard");
        });
    else res.send("You must to login First!!!");
    console.log("You must to login First!!!");
    //   res.end();
});

app.get("/edit/:id", (req, res) => {
    const edit_postID = req.params.id;

    connection.query(
        "SELECT * FROM accounts WHERE id=?",
        [edit_postID],
        (err, results) => {
            if (results) {
                res.render("edit", {
                    post: results[0],
                });
            }
        }
    );
});

app.post("/edit/:id", (req, res) => {
    const update_username = req.body.username;
    const update_password = req.body.password;
    const update_email = req.body.email;
    const id = req.params.id;
    connection.query(
        "UPDATE accounts SET username = ?,password = ? ,email = ? WHERE id = ?",
        [update_username, update_password, update_email, id],
        (err, results) => {
            if (results.changedRows === 1) {
                console.log("Post Updated");
            }
            return res.redirect("/webboard");
        }
    );
});

app.get("/delete/:id", (req, res) => {
    connection.query(
        "DELETE FROM accounts WHERE id = ?",
        [req.params.id],
        (err, results) => {
            return res.redirect("/webboard");
        }
    );
});

// 8.listen on a port, for testing purposes we'll use port 3000:
app.listen(9000);
console.log("running on port 9000...");