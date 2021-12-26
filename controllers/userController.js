const jwt = require("jsonwebtoken");
const axios = require("axios").default;
const Url = require("../models/url");
const User = require("../models/User");
// GET
module.exports.dashboard_get = async (req, res) => {
  try {
    let maxAge = 60 * 60 * 24 * 7;

    let user = await User.findById(req.params.id).populate("urls");
    if (user) {
      // console.log(user);
      res.render("dashboard", { results: user.urls });
    } else {
      res.redirect("/");
    }
  } catch (err) {
    // console.log(err);
    res.redirect("back");
  }
};
//
//
//
// POST
module.exports.dashboard_post = async (req, res) => {
  try {
    const { channel_link } = req.body;
    const user = await User.findById(req.params.id);
    if (channel_link) {
      user.yt_channel_link = channel_link;
      await user.save();
      res.redirect("back");
    } else {
      res.redirect("back");
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports.url_info_get = async (req, res) => {
  const url_slug = req.params.url_slug;
  const token = req.cookies.userAuth;
  if (token) {
    jwt.verify(token, process.env.JWT_S, async (err, decodedToken) => {
      if (!err) {
        let user = await User.findById(decodedToken.id);
        const url = await Url.findOne({ slug: url_slug });
        if (user && url) {
          if (user._id == url.user_id) {
            const response = await axios.get("http://ip-api.com/json/");
            const resp = response.data;

            const data = {
              slug: url.slug,
              clicks: url.clicks,
              countrys: url.region,
            };
            // console.log(data);
            res.render("url_info", { data });
          } else {
            res.redirect("back");
          }
        } else {
          res.redirect("back");
        }
      }
    });
  }
};
