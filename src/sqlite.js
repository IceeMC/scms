const bcrypt = require("bcrypt");
const marked = require("marked");
const sqlite = require("sqlite");
const config = require("./config.json");
let db;

module.exports = {
	name: "sqlite",
	async init() {
		db = await sqlite.open("./db.sqlite");
		db.run(`CREATE TABLE IF NOT EXISTS articles
(id INTEGER PRIMARY KEY AUTOINCREMENT, date INTEGER, title TEXT, author TEXT, article TEXT, rendered TEXT, markdown INTEGER, published INTEGER)`);
		db.run("CREATE TABLE IF NOT EXISTS users (username TEXT UNIQUE PRIMARY KEY, password TEXT, name TEXT)");
		db.run("CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, articleID INTEGER, name TEXT, comment TEXT)");
	},
	//inserting, editing, and deleting
	insert(title, username, article, published, markdown) {
		let date = Math.floor(Date.now()/86400000);
		db.run(`SELECT name FROM users WHERE username = ${username}`).then(user => {
			let rendered = article;
			if (markdown) rendered = marked(article);
			db.run(`INSERT INTO articles (date, title, author, article, rendered, markdown, published)
			VALUES (?, ?, ?, ?, ?, ?, ?)`, [date, title, name, article, rendered, markdown, published]);
		});
	},
	edit(id, title, article) {
		let rendered = article;
		db.run(`SELECT markdown FROM articles WHERE id = "${id}"`).then(article => {
			if (!article) throw new Error(`No article with id ${id} found.`);
			if (markdown) rendered = marked(article);
			db.run(`UPDATE articles SET title = "${title}", article = "${article}", rendered = "${rendered}", WHERE id = "${id}"`);
		});
	},
	delete(id) {
		db.prepare(`DELETE FROM articles WHERE id = "${id}"`);
	},
	publish(id) {
		db.run(`UPDATE articles SET published = 1 WHERE id = "${id}"`);
	},
	//getting articles
	get(num) {
		return db.run(`SELECT * FROM articles WHERE published = 1 ORDER BY id DESC LIMIT "${num}"`).then(results => Array.from(results));
	},
	getone(id) {
		return db.run(`SELECT * FROM articles WHERE id = "${id}" AND published = 1`).then(result => result);
	},
	getall() {
		return db.run("SELECT * FROM articles WHERE published = 1 ORDER BY id DESC").then(articles => Array.from(articles));
	},
	getallunpublished() {
		return db.run("SELECT * FROM articles WHERE published = 0 ORDER BY id DESC").then(unpublished => Array.from(unpublished));
	},
	getoneunpublished(id) {
		return db.run(`SELECT * FROM articles WHERE id = "${id}"`);
	},

	//commenting
	comment(id, name, comment) {
		comment = marked(comment);
		db.run("INSERT INTO comments (articleID, name, comment) VALUES (?, ?, ?)", [id, name, comment]);
	},
	getcomments(id) {
		return db.run(`SELECT * FROM comments WHERE articleID = "${id}" ORDER BY id DESC`).then(comments => Array.from(comments));
	},
	deletecomment(id) {
		db.run(`DELETE FROM comments WHERE id = "${id}"`);
	},

	//user API
	newuser(username, name, plainpw) {
		db.get(`SELECT * FROM users WHERE username = "${username}"`).then(user => {
			if (user) throw Error(`User ${username} already exists!`);
			bcrypt.hash(plainpw, config.saltRounds || 10, (err, password) => {
				if (err) throw err;
				db.run(`INSERT INTO users (username, password, name) VALUES (?, ?, ?)`, [username, password, name]);
			});
		});
	},
	login(username, plainpw) {
		return db.get(`SELECT * FROM users WHERE username = "${username}"`).then(user => {
			if (!user) return new Promise(r=>r(false));
			return bcrypt.compare(plainpw, user.password);
		});
	},
	listusers() {
		return db.get("SELECT username FROM users").then(names => Array.from(names));
	},
	changepw(username, plainpw) {
		db.get(`SELECT * FROM users WHERE username = "${username}"`).then(user => {
			if (!user) throw new Error(`User ${username} not found.`);
		});
		bcrypt.hash(plainpw, config.saltRounds || 10, (err, password) => {
			if (err) throw err;
			db.run(`UPDATE users SET password = "${password}" WHERE username = "${username}"`);
		});
	},
	deleteuser(username) {
		db.run(`DELETE FROM users WHERE username = "${username}"`);
	}
};
