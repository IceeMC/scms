let Database = require("better-sqlite3");
let db = new Database("./db.sqlite");

db.prepare("CREATE TABLE IF NOT EXISTS articles (id INTEGER PRIMARY KEY AUTOINCREMENT, date INTEGER, title TEXT, author TEXT, article TEXT)").run();

module.exports = {
	insert(title, author, article) {
		let date = Math.floor(Date.now()/86400000);
		db.prepare("INSERT INTO articles (date, title, author, article) VALUES (:date, :title, :author, :article)")
			.run({date, title, author, article});
	},
	getfive() {
		return db.prepare("SELECT * FROM articles ORDER BY id DESC LIMIT 5").all();
	},
	getone(id) {
		return db.prepare("SELECT * FROM articles WHERE id = :id").get({id});
	}
};
