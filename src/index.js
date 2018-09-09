//Native modules - fs: read the css dir and see which files to add; http and https: make the server listen, and with configuration options
const fs = require("fs");
const http = require("http");
const https = require("https");

//Imported modules - express: serve site; ejs: render HTML files; express-session: make sessions; helmet: protect express from HTTP header vulnerabilities; xss: sanitize untrusted HTML to prevent XSS attacks
const express = require("express");
const ejs = require("ejs");
const session = require("express-session");
const helmet = require("helmet");
const RateLimiter = require("express-rate-limit");
const xss = require("xss");

//Local modules - database.js: API for the articles and users db; config.json: configuration file; api.js: api router
const db = require("./database.js");
const config = require("./config");//require without extension for js OR json
const api = require("./routes/api.js");
const approuter = require("./routes/app.js");

let app = express();//setup express
//set up middleware to rate limit
let limiter = new RateLimiter({
	windowMs: 1000,
	max: 5
});//1 request per second
app.use(limiter);
app.use(helmet());
app.use(express.json());
app.use(session({secret: config.secret}));
app.use("/css", express.static("templates/css"));//serve static CSS

app.get("/", (req, res) => {
	//get five articles and convert date to a readable format
	let articles = db.get(5);
	articles.forEach(el => el.date = (new Date(el.date * 86400000)).toDateString());
	//render file with config and articles
	ejs.renderFile("templates/index.html", {htmltitle: config.htmltitle, articles}, (err, index) => {
		if (err) throw err;
		res.send(index);
	});
});

app.get("/article/:id", (req, res, next) => {
	//get the article you want and convert date to a readable format
	let data = db.getone(req.params.id);
	if (!data) {
		next(); //404
		return;
	}
	data.date = (new Date(data.date * 86400000)).toDateString();
	//get the comments
	let comments = db.getcomments(req.params.id);
	//render file with config and articles
	ejs.renderFile("templates/article.html", {...config, article: data, comments}, (err, article) => {
		if (err) throw err;
		res.send(article);
	});
});

app.get("/archive", (req, res) => {
	//get all of the articles and convert date to a readable format
	let articles = db.getall();
	articles.forEach(el => el.date = (new Date(el.date * 86400000)).toDateString());
	//render file with config and articles
	ejs.renderFile("templates/archive.html", {htmltitle: config.htmltitle, articles}, (err, archive) => {
		if (err) throw err;
		res.send(archive);
	});
});

app.post("/comment", (req, res) => {
	if (req.body && req.body.comment && req.body.id) {
		if (!req.body.name) req.body.name = "Anonymous";
		if (!db.get(req.body.id)) {
			res.status(404).send("An article with that ID was not found");
			return;
		}
		req.body.comment = xss(req.body.comment);
		db.comment(req.body.id, req.body.name, req.body.comment);
		res.send("true");
	} else res.status(400).send("No comment present!");
});

//API (see api.js)
app.use("/api", api);

app.use("/app", approuter);

app.use("/", express.static("static"));

app.all("*", (req, res) => res.status(404).sendFile("templates/404.html", {root: __dirname}));

http.createServer(app).listen(config.port);
if (config.https) {
	https.createServer({
		key: fs.readFileSync(config.https.key, "utf8"),
		cert: fs.readFileSync(config.https.cert, "utf8")
	}).listen(config.https.port);
}
