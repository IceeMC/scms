let express = require("express");
let app = express();
let ejs = require("ejs");

let exampleObj = {
	htmltitle: "My blog",
	navlinks: [
		{
			link: "https://google.com/",
			text: "google"
		},
		{
			link: "https://reddit.com/",
			text: "reddit"
		},
		{
			link: "https://youtube.com/",
			text: "youtube"
		}
	],
	articles: ["a", "b", "c"],
	footer: "Made by victor"
};

app.get("/", (req, res) => {
	ejs.renderFile("templates/index.html", exampleObj, (err, index) => {
		if (err) throw err;
		res.send(index);
	});
});

app.listen(8080);	
