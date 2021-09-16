import Discord from "./discord/index.mjs";

window.open_tabs = {}; //key = channel id, value = tab's Window

//set up options
window.options = {};
for(const [key, value] of Object.entries(localStorage)) {
	try {
		options[key] = JSON.parse(value);
	} catch {
		console.error(`options[${key}] is not JSON parsable`);
	}
}

//window events
window.onbeforeunload = () => {
	localStorage.clear();
	for(const [key, value] of Object.entries(options)) {
		localStorage[key] = JSON.stringify(value);
	}
	return (Object.keys(open_tabs).length !== 0) ? true : undefined; //warn
};

window.onunload = () => {
	for(const x of Object.values(open_tabs)) x.close();
};

//set up DOM + page
if(options.authorization) {
	document.title = "Loading... | Harmony";
	window.discord = new Discord(options);

	discord.on("READY", async () => {
		document.title = `${discord.state.user.username}#${discord.state.user.discriminator} | Harmony`;
		addPageToDOM("guilds");
	});

	discord.on("MESSAGE_CREATE", async (message) => {
		const tab = open_tabs[message.channel_id];
		if(tab === undefined) return;
		tab.appendMessage(message);
	});

} else {
	document.title = "Login | Harmony";
	const pages = new Pages();
	const token_elem = pages.createElement("input", {type: "password", placeholder: "Authorization token"});
	const intents_elem = pages.createElement("input", {type: "number", placeholder: "Intents code", min: 0, step: 1});
	const contents = pages.createElement("div", {className: "setup"},
		token_elem,
		intents_elem,
		pages.createElement("button", {innerText: "Go", onclick: () => {
			let intents = parseInt(intents_elem.value);
			if(Number.isNaN(intents) || intents < 0) intents = 0;
			options.authorization = token_elem.value;
			options.intents = intents;
			location.reload();
		}})
	);
	document.body.innerHTML = "";
	document.body.append(contents);
}
