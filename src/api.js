//Imported Modules - express: router
let express = require("express");

//Local modules - database.js: API for the articles
let db = require("./database.js");

let app = express.Router(); //make a router
app.use(express.json());

//Non-protected methods
app.get("/article/:id", (req, res) => {
	//get the article you want and send it
	let data = db.getone(req.params.id);
	if (!data) {
		res.sendStatus(404);
		return;
	}
	res.json(db.getone(req.params.id));
});

app.get("/articles/:num?", (req, res) => {
	if (req.params.num) res.json(db.get(req.params.num));
	else res.json(db.getall());
});

//protected using testAuth

app.post("/insert", (req, res) => {
	let auth = req.get("Authorization");
	testAuth(auth).then((username) => {
		if (req.body && req.body.title && req.body.article) {
			db.insert(req.body.title, username, req.body.article, req.body.markdown ? 1 : 0, req.body.published ? 1 : 0);
			res.json(db.get(1)[0]);
		} else res.sendStatus(400);
	}).catch(httpCode => {
		if ([400, 401].includes(httpCode)) res.sendStatus(httpCode);
		else throw Error(httpCode);
	});
});

app.delete("/delete/:id", (req, res) => {
	let auth = req.get("Authorization");
	testAuth(auth).then(() => {
		if (db.getone(req.params.id)) {
			db.delete(req.params.id);
			res.send("Successfully Deleted.");
		} else res.sendStatus(404);
	}).catch(httpCode => {
		if ([400, 401].includes(httpCode)) res.sendStatus(httpCode);
		else throw Error(httpCode);//just in case lol
	});
});

app.put("/edit/:id", (req, res) => {
	let auth = req.get("Authorization");
	testAuth(auth).then(() => {
		if (req.body && req.body.title && req.body.article) {
			if (db.getone(req.params.id)) {
				db.edit(req.params.id, req.body.title, req.body.article);
				res.send("Successfully Edited.");
			} else res.sendStatus(404);
		} else res.sendStatus(400);
	}).catch(httpCode => {
		if ([400, 401].includes(httpCode)) res.sendStatus(httpCode);
		else throw Error(httpCode);
	});
});

app.all("*", (req, res) => res.sendStatus(404));

//test the Authentication header to make sure it's good

function testAuth(auth) {
	return new Promise((resolve, reject) => {
		if (auth && /^Basic .+$/.test(auth)) {
			let text = /^Basic (.+)$/.exec(auth)[1];
			if (text.length % 4 === 0) {
				text = Buffer.from(text, "base64").toString("ascii");
				//yay deconstruction
				let [_, username, password] = /^(.+):(.+)$/.exec(text);
				if (username && password) {
					db.login(username, password).then(el => {
						if (el) {
							resolve(username); //resolve with this for insert
						} else reject(401);
					});
				} else reject(400);
			} else reject(400);
		} else reject(400);
	});
}

module.exports = app;
