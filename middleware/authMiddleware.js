const jwt = require("jsonwebtoken");
const User = require("../models/User");
//  Cookies Max Age :
const maxAge = 60 * 60 * 24 * 7;

const requireAuth = (req, res, next) => {
  const token = req.cookies.userAuth;

  if (token) {
    jwt.verify(token, process.env.JWT_S, (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.redirect("/login");
      } else {
        // console.log(decodedToken);
        next();
      }
    });
  } else {
    res.redirect("/login");
  }
};

// check current user
const checkUser = (req, res, next) => {
  const token = req.cookies.userAuth;
  if (token) {
    jwt.verify(token, process.env.JWT_S, async (err, decodedToken) => {
      if (err) {
        res.locals.user = null;
        next();
      } else {
        let user = await User.findById(decodedToken.id);

        res.locals.user = user;
        next();
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
};

module.exports = { requireAuth, checkUser };
