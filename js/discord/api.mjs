const cdn_base_url = "https://cdn.discordapp.com/";

export function api(parent, options) {
	this.getGuildDetails = async (guild_id) => await this.raw(`guilds/${guild_id}`);
	this.getGuildChannels = async (guild_id) => await this.raw(`guilds/${guild_id}/channels`);
	this.getGuildIconURL = async (guild_object, format = "png") => `${cdn_base_url}icons/${guild_object.id}/${guild_object.icon}.${format}`;

	this.getMessages = async (channel_id) => await this.raw(`channels/${channel_id}/messages?limit=50`);

	this.send = async (channel_id, message) => await this.raw(`channels/${channel_id}/messages`, "POST",
		{"x-content-type": "application/json"},
		JSON.stringify({content: message, nonce: parent.generateSnowflake(), tts: false})
	);

	this.raw = async (path, method="GET", headers={}, body=null) => {
		const r = await fetch(parent.api_base + path, {
			method: method,
			headers: Object.assign({
				"x-user-agent": this.user_agent,
				"x-authorization": options.authorization
			}, headers),
			body: body,
			mode: "cors",
			cache: "no-cache"
		});
		if(1) { //debug
			const text = await r.json();
			console.log(text);
			return text;//JSON.parse(text);
		}
		return await r.json(); //no need for text()?
	};
}

export default api;
