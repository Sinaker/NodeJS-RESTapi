const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const authController = require("../controllers/auth");
const User = require("../models/user");

router.post(
  "/signup",
  [
    body("email", "Not a valid Email")
      .trim()
      .normalizeEmail()
      .isEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            //If user already exists cannot signup
            return Promise.reject("Account already exists!");
          }
        });
      }),

    body("password").trim().isLength({ min: 5 }),
    body("name").trim().notEmpty(),
  ],
  authController.signUp
);

router.post("/login", authController.login);

module.exports = router;
