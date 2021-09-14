export async function guilds(link_onclick, window_object = null) {
	const joined_guilds = [];
	//start up async requests
	for(const id of this.discord.state.user_settings.guild_positions) {
		joined_guilds.push({
			details: this.discord.api.getGuildDetails(id),
			channels: this.discord.api.getGuildChannels(id)
		});
	}

	const container = this.createElement("span", {id: "pages-guilds"}); //WHEN A LINK IS CLICKED, GO LAUNCH A NEW TAB THAT USES THIS DISCORD INSTANCE
	const createChannelElem = (channel_object, guild_object=null) => {
		const ret = this.createElement("a", {
			id: channel_object.id,
			guild_id: channel_object.guild_id,
			className: "channel",
			innerText: "#" + channel_object.name,
			href: "#",
			channel_object: channel_object,
			guild_object: guild_object
		});
		ret.onclick = function() {
			link_onclick(this);
			return false;
		}
		return ret;
	}

	for(const x of joined_guilds) {
		const guild = await x.details;
		const channels = await x.channels;
		const icon_src = await this.discord.api.getGuildIconURL(guild);

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

				case 11:
					//console.log("Heartbeat ACK");
					break;
			}
		}

		const guild_elem = this.createElement("details", {className: "guild", id: guild.id},
			this.createElement("summary", {className: "details"},
				this.createElement("img", {className: "icon", src: icon_src}),
				this.createElement("span", {className: "name", innerText: guild.name})
			)
		);

		const contents = this.createElement("div", {className: "channels"}); //div.channels
			for(const x of ungrouped_order.filter(Boolean)) {
				contents.append(createChannelElem(x, guild));
			}
			for(const group_id of group_order) {
				const group = groups[group_id];
				if(group.channels.length === 0) continue;

				const details = this.createElement("details", {open: true, className: "group", id: group_id},
					this.createElement("summary", {innerText: group.name})
				);
				for(const x of group.channels.filter(Boolean)) {
					details.append(createChannelElem(x, guild));
				}
				contents.append(details);
			}
			guild_elem.append(contents);
		container.append(guild_elem);
	}

	return container;
}

export default guilds;
