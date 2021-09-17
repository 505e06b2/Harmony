//ties in with /js/main.mjs

async function onChannelClick(element) {
	if(open_tabs[element.channel_object.id] && open_tabs[element.channel_object.id].closed !== true) {
		open_tabs[element.channel_object.id].focus(); //doesn't work in Vivaldi, but probably should?
		return;
	}
	if(options.authorization.startsWith("Bot ") !== true) discord.gateway.tabIntoChannel(element);
	const html = (await(await fetch(location.href)).text()).replace(/<script.*?>.*?<\/script>/gm, ""); //strip all JS
	const tab = window.open("blank.html");
	tab.channel = element.channel_object;
	tab.options = options;
	tab.discord = discord;

	tab.onload = async () => {
		tab.document.querySelector('link[rel="icon"]').href = await discord.api.getGuildIconURL(element.guild_object);
		addPageToDOM("chat", tab);
		tab.document.title = `#${element.channel_object.name} / ${element.guild_object.name}`;

		tab.onunload = () => {
			tab.close();
			delete open_tabs[element.channel_object.id];
		}
	}

	open_tabs[element.channel_object.id] = tab;
}

function createChannelElem(channel_object, guild_object=null) {
	const ret = createElement("a", {
		id: channel_object.id,
		guild_id: channel_object.guild_id,
		className: "channel",
		innerText: "#" + channel_object.name,
		href: "#",
		channel_object: channel_object,
		guild_object: guild_object
	});
	ret.onclick = function() {
		onChannelClick(this);
		return false;
	}
	return ret;
}

if(!options.channel_group_open_states) options.channel_group_open_states = {};
if(!options.guild_open_states) options.guild_open_states = {};

const guild_info = [];

//user token || bot token
const guild_list = discord.state.user_settings.guild_positions || discord.state.guilds;

//start up async requests
for(const x of guild_list) {
	const id = x.id || x; //bot token || user token
	guild_info.push({
		details: discord.api.getGuildDetails(id),
		channels: discord.api.getGuildChannels(id)
	});
}

//main
(async () => {
	const container = createElement("span", {id: "pages-guilds"});

	for(const x of guild_info) {
		const guild = await x.details;
		const channels = await x.channels;
		const icon_src = await discord.api.getGuildIconURL(guild);

		const ungrouped_order = [];
		const group_order = [];
		const groups = {};
		for(const channel of channels) {
			switch(channel.type) {
				case 0:
					if(channel.parent_id) {
						if(groups[channel.parent_id] === undefined) groups[channel.parent_id] = {channels: []};
						groups[channel.parent_id].channels[channel.position] = channel;
					} else {
						ungrouped_order[channel.position] = channel;
					}
					break;

				case 4:
					group_order[channel.position] = channel.id;
					if(groups[channel.id] === undefined) groups[channel.id] = {channels: []};
					groups[channel.id].name = channel.name;
					break;
			}
		}

		const guild_elem = createElement("details", {
				className: "guild",
				id: guild.id,
				open: options.guild_open_states[guild.id] || false,
				ontoggle: function() {options.guild_open_states[this.id] = this.open}
			},
			createElement("summary", {className: "details"},
				createElement("img", {className: "icon", src: icon_src}),
				createElement("span", {className: "name", innerText: guild.name})
			)
		);

		const contents = createElement("div", {className: "channels"}); //div.channels
			for(const x of ungrouped_order.filter(Boolean)) {
				contents.append(createChannelElem(x, guild));
			}
			for(const group_id of group_order) {
				const group = groups[group_id];
				if(group.channels.length === 0) continue;

				const details = createElement("details", {
						className: "group",
						id: group_id,
						open: (options.channel_group_open_states[group_id] === false) ? false : true,
						ontoggle: function() {options.channel_group_open_states[this.id] = this.open}
					},
					createElement("summary", {innerText: group.name})
				);

				for(const x of group.channels.filter(Boolean)) {
					details.append(createChannelElem(x, guild));
				}
				contents.append(details);
			}
			guild_elem.append(contents);
		container.append(guild_elem);
	}

	document.body.innerHTML = "";
	document.body.append(createElement("header", {},
		discord.state.user.username + "#" + discord.state.user.discriminator,
		createElement("a", {
			href: "#Logout",
			onclick: () => {options = {}; location.reload(); return false},
			style: "font-size: 50%; float:right",
			innerText: "Logout"
		})
	), container);
})();
