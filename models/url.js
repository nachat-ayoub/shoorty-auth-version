const mongoose = require("mongoose");
const shortid = require("shortid")



const urlSchema = new mongoose.Schema({
	'full_url': {
		type: String,
		required: true
	},
	'slug': {
		type: String,
		default: shortid.generate
	},
	'clicks': {
		type: Number,
		default: 0
	},
  	'date': {
    	type: Date,
    	default: Date.now
  	}
})



const Url = mongoose.model('Url', urlSchema);

module.exports = Url;