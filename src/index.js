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
let api = require("./api.js");

let app = express();//setup express
//set up middleware to rate limit
let limiter = new RateLimiter({
	windowMs: 1000,
	max: 2
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

//make an authenticator
app.use((req, res, next) => {
	if (!req.path.startsWith("/app") || req.path.startsWith("/app/login")) {
		next();
		return;
	}
	if (!req.session.username || !req.session.password) {
		res.redirect("/app/login.html");
		return;
	}
	db.login(req.session.username, req.session.password).then(el => {
		if (el) next();
		else res.redirect("/app/login.html");
	});
});

app.get("/app/editeditor.html", (req, res) => {
	if (req.query.id) {
		let data = db.getone(req.query.id);
		ejs.renderFile("appviews/editeditor.html", {...data, id: req.query.id}, (err, editeditor) => {
			if (err) throw err;
			res.send(editeditor);
		});
	} else res.status(400).send("No ID provided");
});

app.use("/app", express.static("appviews"));//serve static files AFTER authenticator

app.post("/app/login", (req, res) => {
	if (req.body && req.body.username && req.body.password) {
		db.login(req.body.username, req.body.password).then(el => {
			if (el) {
				req.session.username = req.body.username;
				req.session.password = req.body.password;
			}
			req.session.save();
			res.send(String(el));
		});
	} else res.send("false");
});

app.post("/app/insert", (req, res) => {
	if (req.body && req.body.title && req.body.article) {
		if (req.session.username && req.session.password) {
			db.login(req.session.username, req.session.password).then(el => { //just in case ;)
				if (el) {
					db.insert(req.body.title, req.session.username, req.body.article, req.body.markdown ? 1 : 0);
					res.send("true");
				} else res.status(401).send("You are not logged in correctly!");
			});
		} else res.status(401).send("You are not logged in correctly!");
	} else res.status(400).send("Either the title or the article was missing");
});

app.post("/app/delete", (req, res) => {
	if (req.body && req.body.id) {
		if (req.session.username && req.session.password) {
			db.login(req.session.username, req.session.password).then(el => {
				if (el) {
					db.delete(req.body.id);
					res.send("true");
				} else res.status(401).send("You are not logged in correctly!");
			});
		} else res.status(401).send("You are not logged in correctly!");
	} else res.status(400).send("You have sent the wrong id!");
});

app.post("/app/edit", (req, res) => {
	if (req.body && req.body.id && req.body.title && req.body.article) {
		if (req.session.username && req.session.password) {
			db.login(req.session.username, req.session.password).then(el => {
				if (el) {
					db.edit(req.body.id, req.body.title, req.body.article);
					res.send("true");
				} else res.status(401).send("You are not logged in correctly!");
			});
		} else res.status(401).send("You are not logged in correctly!");
	} else res.status(400).send("Either the ID, article, or title are missing");
});

app.use("/", express.static("views"));

app.all("*", (req, res) => res.status(404).sendFile("templates/404.html", {root: __dirname}));

app.listen(config.port);
