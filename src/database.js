let bcrypt = require("bcrypt");
let marked = require("marked");
let Database = require("better-sqlite3");
let db = new Database("./db.sqlite");
let config = require("./config.json");

db.prepare("CREATE TABLE IF NOT EXISTS articles (id INTEGER PRIMARY KEY AUTOINCREMENT, date INTEGER, title TEXT, author TEXT, article TEXT, rendered TEXT, markdown INTEGER)").run();
db.prepare("CREATE TABLE IF NOT EXISTS users (username TEXT UNIQUE PRIMARY KEY, password TEXT, name TEXT)").run();

module.exports = {
	//inserting, editing, and deleting
	insert(title, username, article, markdown) {
		let date = Math.floor(Date.now()/86400000);
		let name = db.prepare("SELECT name FROM users WHERE username = :username").get({username}).name;
		let rendered = article;
		if (markdown.markdown) rendered = marked(article);
		db.prepare(`INSERT INTO articles (date, title, author, article, rendered, markdown)
		VALUES (:date, :title, :name, :article, :rendered, :markdown)`)
			.run({date, title, name, article, rendered, markdown});
	},
	edit(id, title, article) {
		let rendered = article;
		let markdown = db.prepare("SELECT markdown FROM articles WHERE id = :id").get({id});
		if (markdown.markdown) rendered = marked(article);
		db.prepare("UPDATE articles SET title = :title, article = :article, rendered = :rendered WHERE id = :id")
			.run({title, article, rendered, id});
	},
	delete(id) {
		db.prepare("DELETE FROM articles WHERE id = :id").run({id});
	},
	//getting articles
	get(num) {
		return db.prepare("SELECT * FROM articles ORDER BY id DESC LIMIT :num").all({num});
	},
	getone(id) {
		return db.prepare("SELECT * FROM articles WHERE id = :id").get({id});
	},
	//user API
	newuser(username, name, plainpw) {
		if (db.prepare("SELECT * FROM users WHERE username = :username").get({username})) throw Error(`User ${username} already exists!`);
		bcrypt.hash(plainpw, config.saltRounds, (err, password) => {
			if (err) throw err;
			db.prepare("INSERT INTO users (username, name, password) VALUES (:username, :name, :password)").run({username, name, password});
		});
	},
	login(username, plainpw) {
		let user = db.prepare("SELECT * FROM users WHERE username = :username").get({username});
		if (!user) return new Promise(r=>r(false));
		return bcrypt.compare(plainpw, user.password)
	},
	listusers() {
		return db.prepare("SELECT username FROM users").all();
	},
	changepw(username, plainpw) {
		if (!db.prepare("SELECT * FROM users WHERE username = :username").get({username})) throw Error(`User ${username} not found!`);
		bcrypt.hash(plainpw, config.saltRounds, (err, password) => {
			if (err) throw err;
			db.prepare("UPDATE users SET password = :password WHERE username = :username");
		});
	},
	deleteuser(username) {
	 db.prepare("DELETE FROM users WHERE username = :username").run({username});
	}
};
