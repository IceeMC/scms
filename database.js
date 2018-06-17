let Database = require("better-sqlite3");
let db = new Database("./db.sqlite");

db.prepare("CREATE TABLE IF NOT EXISTS articles (id INTEGER PRIMARY KEY AUTOINCREMENT, date INTEGER, title TEXT, article TEXT)").run();

module.exports = {
	insert(title, article) {
		let date = Math.floor(Date.now()/86400000);
		db.prepare("INSERT INTO articles (date, title, article) VALUES (:date, :title, :article)")
			.run({date, title, article});
	},
	getfive() {
		return db.prepare("SELECT * FROM articles ORDER BY id DESC LIMIT 5").all();
	},
	getone(id) {
		return db.prepare("SELECT * FROM articles WHERE id = :id").get({id});
	}
};
