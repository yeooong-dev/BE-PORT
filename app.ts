const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

//body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
