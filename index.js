let express = require("express");
let app = express();
let ejs = require("ejs");
let db = require("./database.js");

let exampleObj = {
	htmltitle: "My blog",
	navlinks: [
		{
			link: "https://google.com/",
			text: "google"
		},
		{
			link: "https://reddit.com/",
			text: "reddit"
		},
		{
			link: "https://youtube.com/",
			text: "youtube"
		}
	],
	footer: "Made by victor"
};

app.get("/", (req, res) => {
	let articles = db.getfive();
	articles.forEach(el => el.date = (new Date(el.date * 86400000)).toDateString());
	ejs.renderFile("templates/index.html", {...exampleObj, articles}, (err, index) => {
		if (err) throw err;
		res.send(index);
	});
});

app.get("/article/:id", (req, res) => {
	let data = db.getone(req.params.id);
	data.date = (new Date(data.date * 86400000)).toDateString();
	ejs.renderFile("templates/article.html", {htmltitle: data.title, navlinks: exampleObj.navlinks, article: data}, (err, article) => {
		if (err) throw err;
		res.send(article);
	});
});

app.listen(8080);	
