const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const feedRoutes = require("./routes/feed");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  )
    cb(null, true);
  else cb(null, false);
};

const app = express();

// app.use(bodyParser.urlEncoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json

app.use(multer({ storage: storage, fileFilter: fileFilter }).single("image"));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/feed", feedRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const errorMsg = error.message; //Default key in error object
  const statusCode = error.statusCOde; //We set this when we get an error
  res.status(error.statusCode || 500).json({ message: error.message });
});

mongoose
  .connect(process.env.MONGODB_CONNECTION)
  .then(() => app.listen(8080))
  .catch((err) => console.log(err));
