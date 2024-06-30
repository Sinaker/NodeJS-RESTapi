const { validationResult } = require("express-validator");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config({ path: "../../.env" });

const User = require("../models/user");

exports.signUp = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed!");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;

  try {
    const hashedPass = await bcryptjs.hash(password, 12);
    const user = new User({ email: email, password: hashedPass, name: name });

    const result = await user.save();

    res.status(201).json({ message: "User has been created!", post: result }); //201 cuz new resource was created
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    err.data = err.data || [];
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("Invalid email");
      error.statusCode = 401; //Not authenticated
      throw error;
    }
    const isMatching = await bcryptjs.compare(password, user.password);

    if (!isMatching) {
      const error = new Error("Incorrect password");
      error.statusCode = 401; //Not authenticated
      throw error;
    }

    //Login is successful
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );
    res.status(200).json({
      message: "Logged In successfully",
      token: token,
      userId: user._id.toString(),
    });
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    err.data = err.data || [];
    next(err);
  }
};
