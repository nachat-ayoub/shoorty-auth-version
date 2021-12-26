// User Model :
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// create json web token
const maxAge = 60 * 60 * 24 * 7;
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_S, {
    expiresIn: maxAge,
  });
};

// errors
let errors = { email: "", password: "" };

const handleErrors = (err) => {
  errors = { email: "", password: "" };
  // incorrect email
  if (err.message === "incorrect email") {
    errors.email = "That email is not registered";
  }
  // incorrect password
  if (err.message === "incorrect password") {
    errors.password = "This password is incorrect";
  }

  // duplicate email :
  if (err.code === 11000) {
    errors.email = "that email is already registered";
    return errors;
  }
  // validation
  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }
  return errors;
};

// GET
module.exports.signup_get = (req, res) => {
  res.render("signup");
};

module.exports.login_get = (req, res) => {
  res.render("login");
};
// Logout :
module.exports.logout_get = (req, res) => {
  res.cookie("userAuth", "", { maxAge: 1 });
  res.redirect("/");
};

// POST
module.exports.signup_post = async (req, res) => {
  let { email, username, password, c_password } = req.body;
  try {
    if (password === c_password) {
      const salt = await bcrypt.genSalt();
      password = await bcrypt.hash(password, salt);

      const user = await User.create({ username, email, password });
      const token = createToken(user._id);
      res.cookie("userAuth", token, { httpOnly: true, maxAge: maxAge * 1000 });

      res.status(201).json({ user: user._id });
    } else {
      errors.password = "passwords are not matched!";
      errors.email = "";
      res.json({ errors });
    }
  } catch (error) {
    // err handler :
    const errors = handleErrors(error);
    res.json({ errors });
  }
};

module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.login(email, password);

    const token = createToken(user._id);
    res.cookie("userAuth", token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json({ user: user._id });
  } catch (err) {
    // err handler :
    console.log(err);
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
};
