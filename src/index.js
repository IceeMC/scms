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

//Local modules - API for the articles and users db; config.json: configuration file; api.js: api router
const config = require("./config");//require without extension for js OR json
const api = require("./routes/api.js");
const approuter = require("./routes/app.js");
let db; // The database object is global.
// Load database
loadDatabase(config.database ? config.database : "sqlite").then(() => {
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
	
	app.get("/", async (req, res) => {
		//get five articles and convert date to a readable format
		let articles = await db.get(5);
		console.log(articles);
		articles.forEach(el => el.date = (new Date(el.date * 86400000)).toDateString());
		//render file with config and articles
		ejs.renderFile("templates/index.html", {htmltitle: config.htmltitle, articles}, (err, index) => {
			if (err) throw err;
			res.send(index);
		});
	});
	
	app.get("/article/:id", async (req, res, next) => {
		//get the article you want and convert date to a readable format
		let data = await db.getone(req.params.id);
		if (!data) {
			next(); //404
			return;
		}
		data.date = (new Date(data.date * 86400000)).toDateString();
		//get the comments
		let comments = await db.getcomments(req.params.id);
		//render file with config and articles
		ejs.renderFile("templates/article.html", {...config, article: data, comments}, (err, article) => {
			if (err) throw err;
			res.send(article);
		});
	});
	
	app.get("/archive", async (req, res) => {
		//get all of the articles and convert date to a readable format
		let articles = await db.getall();
		articles.forEach(el => el.date = (new Date(el.date * 86400000)).toDateString());
		//render file with config and articles
		ejs.renderFile("templates/archive.html", {htmltitle: config.htmltitle, articles}, (err, archive) => {
			if (err) throw err;
			res.send(archive);
		});
	});
	
	app.post("/comment", async (req, res) => {
		if (req.body && req.body.comment && req.body.id) {
			if (!req.body.name) req.body.name = "Anonymous";
			if (!db.get(req.body.id)) {
				res.status(404).send("An article with that ID was not found");
				return;
			}
			req.body.comment = xss(req.body.comment);
			await db.comment(req.body.id, req.body.name, req.body.comment);
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
});

/*
 * Loads the database as defined in the config file.
 * If the file was not found it reverts back to the original database (sqlite)
 * and warns to the console.
 * Otherwise it will check if the database is a valid object before loading it.
 * This will initialize the database before resolving the promise.
 */
async function loadDatabase(name) {
	name = name.endsWith(".js") ? name : `${name}.js`;
	if (!fs.existsSync(`${process.cwd()}/databases/${name}`)) {
		console.warn("Cannot find database file! Reverting back to sqlite.");
		db = require("./sqlite.js");
		await db.init();
		return Promise.resolve();
	}
	const temp = require(`${process.cwd()}/databases/${name}`);
	if (!validDatabase(temp)) {
		console.warn("Invalid database! To view a example visit: https://github.com/vityavv/scms. Reverting back to sqlite.");
		db = require("./sqlite.js");
		await db.init();
		return Promise.resolve();
	}
	console.log(`Loaded database ${name}!`);
	db = require(`${process.cwd()}/databases/${name}`);
	await db.init();
	return Promise.resolve();
}

/*
 * Validates the objects inside the database file.
 * If one single key is not present or the key is not a function it will return false.
 * Otherwise true
 */
function validDatabase(obj) {
	if (!obj) throw new Error("Could not load database. Module has not been exported.");
	if (typeof obj !== "object") throw new Error(`Invalid database type. The type must be an object (received ${typeof obj}).`);
	const keys = [
		"init",
		"insert",
		"edit",
		"delete",
		"publish",
		"get",
		"getone",
		"getall",
		"getallunpublished",
		"getoneunpublished",
		"comment",
		"getcomment",
		"deletecomment",
		"newuser",
		"login",
		"listusers",
		"changepw",
		"deleteuser"
	];
	for (const key of keys) {
		if (!obj[key] || typeof obj[key] !== "function") return false;
	}
	return true;
}

module.exports.db = db;