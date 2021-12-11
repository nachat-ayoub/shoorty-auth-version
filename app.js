const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Url = require("./models/url");
const cookieParser = require('cookie-parser');
require('dotenv').config();
// YT subs Checker :
const ytch = require('yt-channel-info')
// YT channel id :
const channelId = "UCmeSXbSLV3CK8A8u1rkk0dQ";
var subscriberCount = "no subs";

const app = express();

// Middlewares
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(cookieParser());


// func :



// connecting to db
mongoose.connect(process.env.DB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true
}).then(response => console.log('db connected successfully...'))
  .catch(err => console.log(err));




app.get('/', async (req, res) => {
	try {
		const url = await Url.find().sort({"clicks":-1})
		res.render("index", {results : url})
	} catch(err) { console.log(err) }

})


app.get('/check', async (req, res) => {
	
	ytch.getChannelInfo(channelId, 0).then((resp) => {   
		const ch_name = resp.author;
		const subscriberText = resp.subscriberText;
		subscriberCount = resp.subscriberCount;
		
		const text = `\n\n Channel Name: ${ch_name} 
					\n\n Channel subscriber Text: ${subscriberText} 
					\n\n Channel subscriber Count: ${subscriberCount} `;
		// console.log(text);
		var yt_data = {
			subs:subscriberCount,
		};
		res.json(yt_data);
	}).catch((err) => {
		console.log(err)
	})

})

app.get('/test', async (req, res) => {
	res.render("timer")
})

app.get('/test2', async (req, res) => {
	res.render("timer2")
})


app.post('/short', async (req, res) => {
	try {
		const { full_url } = req.body;
		const NewShortUrl = await Url.create({ full_url })
		await NewShortUrl.save()
		res.redirect("/")
	} catch(err) { console.log(err) }
})

// cookies.set('testtoken', {maxAge: 0});
app.get('/:slug', async (req, res) => {
	try {
		const url = await Url.findOne({ slug : req.params.slug })
		if (url == null) {
			res.sendStatus(404)
		} else {
			res.cookie('linkSlug', url.slug);
			const token = req.cookies.isPassed;
			if (token) {
				if (token == "true") {
					url.clicks++
					url.save()
					res.cookie('isPassed', '', { maxAge: 1 });
					res.cookie('linkSlug', ' ', { maxAge: 1 });
					if (url.full_url.includes("http")) {
						res.redirect(url.full_url)
					} else {
						res.redirect(`http://${url.full_url}`)
					}
				} else {
					res.redirect(`/test`)
				}
			}else {res.redirect(`/test`)}
		}


			
	} catch(err) { console.log(err) }
})



const port = process.env.PORT || 9000;
app.listen(port, () => {
	try {
 		console.log(`Server running on ${port}`)
	}
	catch(err) { console.log(err) } 
})