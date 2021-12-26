const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const Url = require("./models/url");
const User = require("./models/User");
const cookieParser = require("cookie-parser");
require("dotenv").config();
// YT subs Checker :
const ytch = require("yt-channel-info");

const app = express();

// Routes :
const AuthRoutes = require("./routes/authRoutes");
const UserRoutes = require("./routes/userRoutes");
const { requireAuth, checkUser } = require("./middleware/authMiddleware");
const { redirect } = require("express/lib/response");

//
// Middlewares
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.get("*", checkUser);
// func :

const testDb_uri = "mongodb://127.0.0.1:27017/testDB";
// connecting to db process.env.DB_URI
mongoose
  .connect(process.env.DB_URI || testDb_uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    autoIndex: true,
  })
  .then((response) => console.log("db connected successfully..."))
  .catch((err) => console.log(err));

app.get("/", requireAuth, async (req, res) => {
  try {
    const token = req.cookies.userAuth;
    if (token) {
      jwt.verify(token, process.env.JWT_S, async (err, decodedToken) => {
        if (err) {
          console.log(err);
        } else {
          let user = await User.findById(decodedToken.id)
            .populate("urls")
            .sort({ _id: 1 });
          if (user) {
            res.render("index", { results: user.urls });
          }
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

// Start : Login Page And Logic :
app.use("/", AuthRoutes);
app.use("/user/", requireAuth, UserRoutes);

// Delete links :
app.delete("/:slug", async (req, res) => {
  let slug = req.params.slug;
  const url = await Url.findOneAndDelete({ slug: slug });
  // res.redirect("back");
});

// check subs :
app.get("/check/:id", async (req, res) => {
  let channelId = "";
  if (req.params.id === "admin") {
    channelId = process.env.YT_ADMIN_CH.split("/")[4];
  } else if (req.params.id !== "admin") {
    const user = await User.findById(req.params.id);
    if (user && user.yt_channel_link) {
      channelId = user.yt_channel_link.split("/")[4];
    }
  } else {
    res.redirect("back");
  }
  ytch
    .getChannelInfo(channelId, 0)
    .then((resp) => {
      subscriberCount = resp.subscriberCount;

      const sortBy = "newest";

      ytch
        .getChannelVideos(channelId, sortBy, 0)
        .then((response) => {
          let v_data = [];
          response.items.forEach((el) => {
            v_data.push({
              title: el.title,
              video_id: el.videoId,
              video_thumbnail:
                el.videoThumbnails[el.videoThumbnails.length - 1],
              viewCount: el.viewCount,
            });
          });
          const yt_data = {
            subs: subscriberCount,
            v_data: v_data,
          };
          res.json(yt_data);
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/test", async (req, res) => {
  const url_slug = req.cookies.linkSlug;
  const url = await Url.findOne({ slug: url_slug });
  if (url) {
    const user = await User.findById(url.user_id);
    if (user && user.yt_channel_link) {
      const yt_data = {
        user_id: user._id,
        user_ch: user.yt_channel_link || process.env.YT_ADMIN_CH,
      };
      res.render("timer", { yt_data });
    } else {
      const yt_data = {
        user_id: "admin",
        user_ch: process.env.YT_ADMIN_CH,
      };
      res.render("timer", { yt_data });
    }
  } else {
    res.redirect("back");
  }
});

app.get("/test2", async (req, res) => {
  res.render("timer2");
});

app.post("/short", async (req, res) => {
  try {
    const { full_url } = req.body;
    const NewShortUrl = await Url.create({ full_url });
    await NewShortUrl.save();
    const url_id = NewShortUrl._id;
    //  Save Url Id To User Refrences :
    const token = req.cookies.userAuth;
    if (token) {
      jwt.verify(token, process.env.JWT_S, async (err, decodedToken) => {
        if (err) {
          console.log(err);
          res.redirect("/");
        } else {
          let user = await User.findById(decodedToken.id);
          NewShortUrl.user_id = user._id;
          await NewShortUrl.save();
          user.urls.push(url_id);
          await user.save();
          res.redirect("/");
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

// cookies.set('testtoken', {maxAge: 0});
app.get("/:slug", async (req, res) => {
  try {
    const url = await Url.findOne({ slug: req.params.slug });
    if (url == null) {
      res.sendStatus(404);
      res.redirect("back");
    } else {
      res.cookie("linkSlug", url.slug);
      const token = req.cookies.isPassed;
      if (token) {
        if (token == "true") {
          url.clicks++;

          const resp = await axios.get("http://ip-api.com/json");
          const country = resp.data.country;
          console.log("Visitor country: ", country);
          const c_found = url.region.some((e) => e.country == country);
          if (!c_found) {
            url.region.push({ country: country, click: 1 });
          } else {
            url.region.find((e) => e.country == country).click++;
          }

          url.save();
          res.cookie("isPassed", "", { maxAge: 1 });
          res.cookie("linkSlug", " ", { maxAge: 1 });
          if (url.full_url.includes("http")) {
            res.redirect(url.full_url);
          } else {
            res.redirect(`http://${url.full_url}`);
          }
        } else {
          res.redirect(`/test`);
        }
      } else {
        res.redirect(`/test`);
      }
    }
  } catch (err) {
    console.log(err);
  }
});

const port = process.env.PORT || 9000;
app.listen(port, () => {
  try {
    console.log(`Server running on http://localhost:${port}/`);
  } catch (err) {
    console.log(err);
  }
});

// New Deploy cmd :
// git init && heroku git:remote -a shortcraft && git add . && git commit -am "make it better" && git push heroku master
//
// Deploying cmd :
// git add .
// git commit -am "make it better"
// git push heroku master
