//Native modules - fs: read the css dir and see which files to add
let fs = require("fs");

//Imported modules - express: serve site; ejs: render HTML files
let express = require("express");
let ejs = require("ejs");

//Local modules - database.js: API for the articles db; config.json: configuration file
let db = require("./database.js");
let config = require("./config.json");

let app = express();//setup express
app.use(express.json());
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
				db.insert(req.body.title, req.body.username, req.body.article);
				res.json(db.get(1)[0]);
			}
		});
	} else {
		res.sendStatus(400);
	}
});

app.listen(8080);	
