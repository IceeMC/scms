//Native modules - fs: read the css dir and see which files to add
let fs = require("fs");

//Imported modules - express: serve site; ejs: render HTML files; express-session: make sessions; helmet: protect express from HTTP header vulnerabilities
let express = require("express");
let ejs = require("ejs");
let session = require("express-session");
let helmet = require("helmet");
let RateLimiter = require("express-rate-limit");

//Local modules - database.js: API for the articles and users db; config.json: configuration file; api.js: api router
let db = require("./database.js");
let config = require("./config");//require without extension for js OR json
let api = require("./routes/api.js");
let approuter = require("./routes/app.js");

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
let cssfiles = fs.readdirSync("./templates/css");//read which CSS files to use
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
	//render file with config and articles
	ejs.renderFile("templates/article.html", {...config, article: data, css: cssfiles}, (err, article) => {
		if (err) throw err;
		res.send(article);
	});
});

//API (see api.js)
app.use("/api", api);

app.use("/app", approuter);

app.use("/", express.static("views"));

app.all("*", (req, res) => res.status(404).sendFile("templates/404.html", {root: __dirname}));

app.listen(config.port);
