const cdn_base_url = "https://cdn.discordapp.com/";

export function api(discord, options) {
	this.getGuildDetails = async (guild_id) => await this.raw(`guilds/${guild_id}`);
	this.getGuildChannels = async (guild_id) => await this.raw(`guilds/${guild_id}/channels`);
	this.getGuildIconURL = async (guild_object, format = "png") => `${cdn_base_url}icons/${guild_object.id}/${guild_object.icon}.${format}`;

	this.getMessages = async (channel_id) => await this.raw(`channels/${channel_id}/messages?limit=50`);

	this.sendMessage = async (channel_id, message) => await this.raw(`channels/${channel_id}/messages`, "POST",
		{"x-content-type": "application/json"},
		JSON.stringify({content: message, nonce: discord.generateSnowflake(), tts: false})
	);

	this.sendFileMessage = async (channel_id, file, message=null) => {
		const data = new FormData();
		data.append("nonce", discord.generateSnowflake());
		if(message) data.append("content", message);
		data.append("file", file, file.name);

		return await this.raw(`channels/${channel_id}/messages`, "POST",
		{"content-type": "text/plain", "x-content-type": "multipart/form-data"}, //php consumes content-type: multipart
		data);
	}

	this.raw = async (path, method="GET", headers={}, body=null) => {
		const r = await fetch(discord.api_base + path, {
			method: method,
			headers: Object.assign({
				"x-user-agent": this.user_agent,
				"x-authorization": options.authorization
			}, headers),
			body: body,
			mode: "cors",
			cache: "no-cache"
		});
		return await r.json(); //no need for text()?
	};
}

export default api;
