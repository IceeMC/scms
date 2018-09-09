let readline = require("readline");
let interface = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: ""
});

let db = require("./database.js");

let commands = {
	quit(rl) {
		rl.write("Quitting...\n");
		process.exit(0);
	},
	adduser(rl) {
		return new Promise(resolve => {
			rl.question("Enter a username: ", username => {
				rl.question("Enter a password: ", password => {
					rl.question("Enter the name of the user: ", name => {
						db.newuser(username, name, password);
						rl.write("User created\n");
						resolve();
					});
				});
			});
		});
	},
	list(rl) {
		return new Promise(resolve => {
			db.listusers().forEach(el => rl.write(el.username + "\n"));
			resolve();
		});
	},
	change(rl) {
		return new Promise(resolve => {
			rl.question("Enter the username of the account who's password you want to change: ", username => {
				rl.question("Enter the new password: ", password => {
					db.changepw(username, password);
					rl.write("Password changed\n");
					resolve();
				});
			});
		});
	},
	delete(rl) {
		return new Promise(resolve => {
			rl.question("Enter the username of the account you want to delete: ", username => {
				db.deleteuser(username);
				rl.write("If that user existed, they don't anymore\n");
				resolve();
			});
		});
	}
}

function main() {
	rl.question("Enter a command, or 'help' for help: ", command => {
		command = command.trim().toLowerCase();
		commands[command](interface).then(() => main());
	});
}

main();
