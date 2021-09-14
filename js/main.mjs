import Discord from "./discord/index.mjs";
import Pages from "./pages/index.mjs";

const open_tabs = {}; //key = channel id, value = tab's Window

setInterval(() => { //can't get onunload/onbeforeunload/onclose events to work in Vivaldi
	for(const [id, tab] of Object.entries(open_tabs)) {
		if(tab.closed) delete open_tabs[id];
	}
}, 1000);

//set up options
{
	const options = {};
	for(const [key, value] of Object.entries(localStorage)) {
		try {
			options[key] = JSON.parse(value);
		} catch {
			console.error(`options[${key}] is not JSON parsable`);
		}
	}
	window.options = options; //accessible in global scope
}

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
	const discord = new Discord(options);
	const pages = new Pages(discord);

	async function onChannelClick(element) {
		if(open_tabs[element.channel_object.id] && open_tabs[element.channel_object.id].closed !== true) {
			open_tabs[element.channel_object.id].focus(); //doesn't work in Vivaldi, but probably should?
			return;
		}
		discord.gateway.tabIntoChannel(element);
		const html = (await(await fetch(location.href)).text()).replace(/<script.*?>.*?<\/script>/gm, ""); //strip all JS
		const tab = window.open();
		tab.document.write(html);
		tab.document.head.append(pages.createElement("link", {rel: "stylesheet", href: "css/pages-chat.css"}));
		tab.document.title = `#${element.channel_object.name} / ${element.guild_object.name}`;
		tab.document.querySelector('link[rel="icon"]').href = await discord.api.getGuildIconURL(element.guild_object);

		const chat_body = await pages.chat(element.channel_object, tab); //added with guilds.mjs
		tab.document.body.innerHTML = "";
		tab.document.body.append(chat_body);
		open_tabs[element.channel_object.id] = tab;
	}

	discord.on("READY", async () => {
		document.title = `${discord.state.user.username}#${discord.state.user.discriminator} | Harmony`;

		const pages_guilds = await pages.guilds(onChannelClick);
		if(!options.guild_open_states) options.guild_open_states = {};
		for(const x of pages_guilds.querySelectorAll('details.guild')) {
			x.ontoggle = () => options.guild_open_states[x.id] = x.open;
			x.open = options.guild_open_states[x.id] || false;
		}

		if(!options.channel_group_open_states) options.channel_group_open_states = {};
		for(const x of pages_guilds.querySelectorAll('details.group')) {
			x.ontoggle = () => options.channel_group_open_states[x.id] = x.open;
			x.open = (options.channel_group_open_states[x.id] === false) ? false : true;
		}

		document.body.innerHTML = "";
		document.body.append(pages.createElement("header", {},
			discord.state.user.username + "#" + discord.state.user.discriminator,
			pages.createElement("a", {
				href: "#Logout",
				onclick: () => {options = {}; location.reload(); return false},
				style: "font-size: 50%; float:right",
				innerText: "Logout"
			})
		), pages_guilds);
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
