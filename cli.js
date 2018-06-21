let readline = require("readline");
let rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: ""
});

let db = require("./database.js");

function main() {
	rl.question("Enter a command, or 'help' for help: ", command => {
		command = command.trim().toLowerCase();
		if (command === "help") {
			rl.write("Help - this text\nQuit - exit the program\nAdduser - make a new user\nList - list the users\nChange - change a user's password\nDelete - delete a user\n");
			main();
		} else if (command === "quit") {
			rl.write("Quitting...\n");
			process.exit(0);
		} else if (command === "adduser") {
			rl.question("Enter a username: ", username => {
				rl.question("Enter a password: ", password => {
					db.newuser(username, password);
					rl.write("User created\n");
					main();
				});
			});
		} else if (command === "list") {
			db.listusers().forEach(el=>rl.write(el.username + "\n"));
			main();
		} else if (command === "change") {
			rl.question("Enter the username of the account who's password you want to change: ", username => {
				rl.question("Enter the new password: ", password => {
					db.changepw(username, password);
					rl.write("Password changed\n");
					main();
				});
			});
		} else if (command === "delete") {
			rl.question("Enter the username of the account you want to delete: ", username => {
				db.deleteuser(username);
				rl.write("If that user existed, they don't anymore\n");
				main();
			});
		} else {
			rl.write("Unknown command. Type 'help' for help\n");
			main();
		}
	});
}

main();
