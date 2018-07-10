//Native modules - fs: read the css dir and see which files to add
let fs = require("fs");

//Imported modules - express: serve site; ejs: render HTML files
let express = require("express");
let ejs = require("ejs");
let session = require("express-session");

//Local modules - database.js: API for the articles and users db; config.json: configuration file
let db = require("./database.js");
let config = require("./config.json");

let app = express();//setup express
app.use(express.json());
app.use(session({secret: config.secret}));
let cssfiles = fs.readdirSync("./templates/css");//read which CSS files to use
app.use("/css", express.static("templates/css"));//serve static CSS

app.get("/", (req, res) => {
	//get five articles and convert date to a readable format
	let articles = db.get(5);
	articles.forEach(el => el.date = (new Date(el.date * 86400000)).toDateString());
	//render file with config and articles
	ejs.renderFile("templates/index.html", {...config, articles, css: cssfiles}, (err, index) => {
		if (err) throw err;
		res.send(index);
	});
});

app.get("/article/:id", (req, res) => {
	//get the article you want and convert date to a readable format
	let data = db.getone(req.params.id);
	data.date = (new Date(data.date * 86400000)).toDateString();
	//render file with config and articles
	ejs.renderFile("templates/article.html", {...config, article: data, css: cssfiles}, (err, article) => {
		if (err) throw err;
		res.send(article);
	});
});

app.get("/api/article/:id", (req, res) => {
	//get the article you want and send it
	res.json(db.getone(req.params.id));
});

app.get("/api/articles/:num?", (req, res) => {
	res.json(db.get(req.params.num || 5));
});

app.post("/api/insert", (req, res) => {
	if (req.body && req.body.title && req.body.article && req.body.username && req.body.password) {
		db.login(req.body.username, req.body.password).then(el => {
			if (!el) res.sendStatus(400);
			else {
				db.insert(req.body.title, req.body.username, req.body.article, req.body.markdown ? 1 : 0);
				res.json(db.get(1)[0]);
			}
		});
	} else {
		res.sendStatus(400);
	}
});

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

app.listen(8080);
