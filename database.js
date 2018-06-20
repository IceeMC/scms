let bcrypt = require("bcrypt");
let Database = require("better-sqlite3");
let db = new Database("./db.sqlite");
let config = require("./config.json");

db.prepare("CREATE TABLE IF NOT EXISTS articles (id INTEGER PRIMARY KEY AUTOINCREMENT, date INTEGER, title TEXT, author TEXT, article TEXT)").run();
db.prepare("CREATE TABLE IF NOT EXISTS users (username TEXT UNIQUE PRIMARY KEY, password TEXT)").run();

module.exports = {
	insert(title, author, article) {
		let date = Math.floor(Date.now()/86400000);
		db.prepare("INSERT INTO articles (date, title, author, article) VALUES (:date, :title, :author, :article)")
			.run({date, title, author, article});
	},
	get(num) {
		return db.prepare("SELECT * FROM articles ORDER BY id DESC LIMIT :num").all({num});
	},
	getone(id) {
		return db.prepare("SELECT * FROM articles WHERE id = :id").get({id});
	},

	newuser(username, plainpw) {
		if (db.prepare("SELECT * FROM users WHERE username = :username").all({username}).username) throw Error(`User ${username} already exists!`);
		bcrypt.hash(plainpw, config.saltRounds, (err, password) => {
			if (err) throw err;
			db.prepare("INSERT INTO users (username, password) VALUES (:username, :password)").run({username, password});
		});
	},
	login(username, plainpw) {
		let user = db.prepare("SELECT * FROM users WHERE username = :username").get({username});
		if (!user) return new Promise(r=>r(false));
		return bcrypt.compare(plainpw, user.password)
	}
};
