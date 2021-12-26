const mongoose = require("mongoose");
const shortid = require("shortid");

const User = require("./User");

const urlSchema = new mongoose.Schema({
  full_url: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    default: shortid.generate,
  },
  user_id: {
    type: String,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  region: [
    {
      country: {
        type: String,
      },
      click: {
        type: Number,
        default: 0,
      },
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

const Url = mongoose.model("Url", urlSchema);

module.exports = Url;
//
//
//
//
//
//
//
//
//
//
//
async function show_user(name) {
  const user = await User.findOne({ username: name }).populate("urls");
  console.log("==> username : ", user.username);
  console.log("==> email : ", user.email);
  console.log(user);
}
//
// show_user("ayoub");
