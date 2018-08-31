# scms
A Simple Content Management System aimed at web developers.

## Aim
The aim of this project is to give existing web developers a simple, light platform for simple content management, while being as flexible as possible. This means that you can make your own theme from the ground up with little in your way while using the web interface to create articles instead of having to ssh to a server and write everything raw.

## Configuration

### config.json/config.js
| key | meaning |
| --- | --- |
| htmltitle | The title that goes in the <title> element on the main pages |
| saltrounds | A [bcrypt](https://npmjs.com/bcrypt) option; bcrypt is used for the user interface |
| secret | ^ |
| port | The port that the service runs on. This doesn't support https because it is recommended that you use a reverse proxy |

### Templates
The templates, in the `src/templates` folder, are created to be easy and simple to configure. They use [ejs](https://ejs.co) templates; here is what is exposed:

* `articles` - An array consisting of objects with the following properties:

| key | menaing |
| --- | --- |
| id | The article id |
| date | A date string (javascript `Date().toDateString()`) that shows when the article was written |
| title | The title of the article |
| author | The person who wrote the article |
| article | The *raw* text for the article |
| rendered | The *rendered* HTML for the article |
| markdown | A number; 0 means that the article is raw HTML, 1 means it uses markdown |
* `htmltitle` - The title of the scms

## Setup
To set this up, follow these simple steps:

```
$ git clone https://github.com/vityavv/scms.git
$ cd scms/src
$ cp sample-config.json config.json
```

Tada! Now that you are set up with the basics, move on to usage to see how it works.

## Usage

### Managing users
You can manage users by running `node cli.js` in the `src/` folder. I think that the help page is pretty self-explanatory.

### Running the service
```
$ # Go to the src/ folder
$ node index.js
```
tada! If you use the default config, you can go to `localhost:8080` to view the thing

### Running the service in production

While scms already has methods in place for running the app in production, it is recommended that you use a reverse proxy to handle things. This makes your application *much safer*. I recommend [nginx](https://www.nginx.com/) for your reverse proxy because it is very fast and relatively easy to configure and use. There are some guides on how to configure nginx to be a reverse proxy for a node.js application online, like [this one](https://medium.com/@utkarsh_verma/configure-nginx-as-a-web-server-and-reverse-proxy-for-nodejs-application-on-aws-ubuntu-16-04-server-872922e21d38).

### Using the web interface
You can go to `<domain>/app/login.html` (where `<domain>` is the domain you are running it on) to log in (provided you set up a user, see `Managing users`) and then `<domain>/app/dashboard.html` to make, edit, and delete them

### Using the API

#### Getting articles

| Request verb | Path | Use |
| --- | --- | --- |
| GET | `/api/article/:id` | will get a specific article, where `:id` is replaced with the ID of the article |
| GET | `/api/articles/:num?` | will get any number of the most recent articles (put into an array), where `:num?` is an optional property denotating how many articles to fetch---in absence of this property, all articles are fetched |

A single article will look something like this:

```json
{
	"id": 4,
	"date": 17772,
	"title": "Testing out the API!",
	"author": "George Georginson",
	"article": "Wow, look at me! Testing the api out like I am! Let's try some...\n\n### Markdown!",
	"rendered": "<p>Wow, look at me! Testing the api out like I am! Let&#39;s try some...</p>\n<h3 id=\"markdown-\">Markdown!</h3>\n<p>damn I hope it worked lol</p>\n",
	"markdown": 1
}
```

The only things of note here are the date, which is simply the number of days since the epoch that the article was written, and the markdown property, which reffers to whether the article is markdown or not. In the event that the article is not markdown, the rendered property and article property will have the same value.

#### Inserting, deleting, and editing articles

**All of these methods** must have a valid [basic Authorization header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization) with the username and password of the person inserting, deleting, and editing articles.

| Request verb | Path | Use |
| --- | --- | --- |
| POST | `/api/insert` | Use with a JSON body (and a `Content-Type` header set to `application/json`. The JSON body must contain the keys `title` and `article` with the values of... well... the title and article of the article you're inserting. You may also add an optional `markdown` property which should be truthy if `article` is written in markdown. You may also add an optional `published` property which should be truthy if the article should be published immediatelyOnce the article is inserted into the database, it will be returned to you in JSON form as if you had requested it with the methods above |
| DELETE | `/api/delete/:id` | will delete a specific article, where `:id` is replaced with the ID of the article you want to delete. Will respond with `"Successfully Deleted."` upon success. |
| PUT | `/edit/:id` | Use in the same manner as `/api/insert` except with no `markdown` key (the `markdown` property will be the same as when the article was inserted) and with `:id` in the URL replaced with the `id` of the article you want to edit. Will respond with `"Successfully Edited."` upon success. |
