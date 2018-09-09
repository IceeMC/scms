const readline = require("readline");
const interface = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: ""
});

const db = require("./database.js");

const commands = {
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
	},
	help(rl) {
		return new Promise(resolve => {
			rl.write("Help - this text\nQuit - exit the program\nAdduser - make a new user\nList - list the users\nChange - change a user's password\nDelete - delete a user\n");
			resolve();
		});
	}
}

function main() {
	interface.question("Enter a command, or 'help' for help: ", command => {
		command = command.trim().toLowerCase();
		if (commands[command]) commands[command](interface).then(() => main());
		else {
			interface.write("Unknown command. Type 'help' for help\n");
			main();
		}
	});
}

main();
