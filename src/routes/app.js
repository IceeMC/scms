//Imported modules - express: make router; ejs: render HTML files; express-session: make sessions; formidable: parse an uploaded file
let express = require("express");
let ejs = require("ejs");
let session = require("express-session");
let formidable = require("formidable");

//Local modules - database.js: API for the articles and users db; config.json: configuration file
let db = require("../database.js");
let config = require("../config");

let app = express.Router(); //make a router
app.use(express.json());
app.use(session({secret: config.secret}));

//make an authenticator
app.use((req, res, next) => {
	if (!req.path.startsWith("/") || req.path.startsWith("/login")) {
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

app.get("/editeditor.html", (req, res) => {
	if (req.query.id) {
		let data = db.getone(req.query.id);
		ejs.renderFile("appviews/editeditor.html", {...data, id: req.query.id}, (err, editeditor) => {
			if (err) throw err;
			res.send(editeditor);
		});
	} else res.status(400).send("No ID provided");
});

app.get("/dashboard.html", (req, res) => {
	let articles = db.getallunpublished();
	articles.forEach(el => el.date = (new Date(el.date * 86400000)).toDateString());
	ejs.renderFile("appviews/dashboard.html", {articles}, (err, rendered) => {
		if (err) throw err;
		res.send(rendered);
	});
});

app.use("/", express.static("appviews"));//serve static files AFTER authenticator

app.get("/article/:id", (req, res, next) => {
	//get the article you want and convert date to a readable format
	let data = db.getoneunpublished(req.params.id);
	if (!data) {
		next(); //404
		return;
	}
	data.date = (new Date(data.date * 86400000)).toDateString();
	//get comments
	let comments = db.getcomments(req.params.id);
	//render file with config and articles
	if (!data.published) data.title = "UNPUBLISHED - " + data.title;
	ejs.renderFile("appviews/article.html", {...config, article: data, comments}, (err, article) => {
		if (err) throw err;
		res.send(article);
	});
});

app.post("/login", (req, res) => {
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

app.post("/publish", (req, res) => {
	if (req.body && req.body.id) {
		db.publish(req.body.id);
		res.send("true");
	} else res.status(400).send("You haven't sent an ID to publish!");
});

app.post("/insert", (req, res) => {
	if (req.body && req.body.title && req.body.article) {
		db.insert(req.body.title, req.session.username, req.body.article, req.body.markdown ? 1 : 0, 0);
		//the last 0 is because articles aren't automatically published
		res.send("true");
	} else res.status(400).send("Either the title or the article was missing");
});

app.post("/delete", (req, res) => {
	if (req.body && req.body.id) {
		db.delete(req.body.id);
		res.send("true");
	} else res.status(400).send("You haven't sent an ID to delete!");
});

app.post("/edit", (req, res) => {
	if (req.body && req.body.id && req.body.title && req.body.article) {
		db.edit(req.body.id, req.body.title, req.body.article);
		res.send("true");
	} else res.status(400).send("Either the ID, article, or title are missing");
});

app.post("/deletecomment", (req, res) => {
	if (req.body && req.body.id) {
		db.deletecomment(req.body.id);
		res.send("true");
	} else res.status(400).send("You haven't sent a comment ID to delete!");
});

app.post("/upload", (req, res) => {
	let form = new formidable.IncomingForm();
	form.parse(req);
	form.on("fileBegin", (name, file) => {
		file.path = __dirname + "/../static/images/" + file.name;
	});
	form.on("file", (name, file) => {
		console.log("uploaded", file.name);
	});
	res.send("bye");
});

module.exports = app;
