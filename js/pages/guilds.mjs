export async function guilds(discord) {
	const joined_guilds = [];
	//start up async requests
	for(const id of discord.state.user_settings.guild_positions) {
		joined_guilds.push({
			details: discord.api.getGuildDetails(id),
			channels: discord.api.getGuildChannels(id)
		});
	}

	let html = `<span id="pages-guilds">`; //WHEN A LINK IS CLICKED, GO LAUNCH A NEW TAB THAT USES THIS DISCORD INSTANCE
	for(const x of joined_guilds) {
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
		html += `<details class="guild">`;
			html += `<summary class="details"><img class="icon" src="${icon_src}"><span class="name">${guild.name}</span></summary>`;
			html += `<div class="channels">`;
				for(const x of ungrouped_order.filter(Boolean)) {
					html += `<a href="" class="channel ungrouped">#${x.name}</a>`;
				}
				for(const group_id of group_order) {
					const group = groups[group_id];
					if(group.channels.length === 0) continue;

					html += `<details open>`;
						html += `<summary class="group">${group.name}</summary>`;
						for(const x of group.channels.filter(Boolean)) {
							html += `<a href="" class="channel">#${x.name}</a> `;
						}
					html += `</details>`;
				}
			html += `</div>`;
		html += `</details>`;
	}
	return html + `</span>`;
}

export default guilds;
