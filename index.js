let fs = require("fs");

let express = require("express");
let ejs = require("ejs");

let db = require("./database.js");
let config = require("./config.json");

let app = express();
let cssfiles = fs.readdirSync("./templates/css");
app.use("/css", express.static("templates/css"));

app.get("/", (req, res) => {
	let articles = db.getfive();
	articles.forEach(el => el.date = (new Date(el.date * 86400000)).toDateString());
	ejs.renderFile("templates/index.html", {...config, articles, css: cssfiles}, (err, index) => {
		if (err) throw err;
		res.send(index);
	});
});

app.get("/article/:id", (req, res) => {
	let data = db.getone(req.params.id);
	data.date = (new Date(data.date * 86400000)).toDateString();
	ejs.renderFile("templates/article.html", {...config, article: data, css: cssfiles}, (err, article) => {
		if (err) throw err;
		res.send(article);
	});
});

app.listen(8080);	
