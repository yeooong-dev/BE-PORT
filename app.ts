const express = require("express");
const path = require("path");
const session = require("express-session");
const app = express();
const PORT = 3000;

//body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// session
app.use(
    session({
        secret: "your-secret-key",
        resave: false,
        saveUninitialized: true,
    })
);

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
