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

### Using the web interface
You can go to `<domain>/app/login.html` (where `<domain>` is the domain you are running it on) to log in (provided you set up a user, see `Managing users`) and then `<domain>/app/dashboard.html` to make, edit, and delete them

### Using the API
The API is still a work in progress so there is no documentation for it yet.
