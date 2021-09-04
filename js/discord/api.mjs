export function api(parent) {
	this.getMessages = async (channel_id) => await this.raw(`channels/${channel_id}/messages?limit=50`);

	this.send = async (channel_id, message) => await this.raw(`channels/${channel_id}/messages`, "POST",
		{"x-content-type": "application/json"},
		JSON.stringify({content: message, nonce: parent.generateSnowflake(), tts: false})
	);

	this.raw = async (path, method="GET", headers={}, body=null) => {
		const r = await fetch(parent.api_base + path, {
			method: method,
			headers: Object.assign({
				"x-authorization": localStorage.authorization
			}, headers),
			body: body,
			mode: "cors",
			cache: "no-cache"
		});
		return await r.json(); //no need for text()?
	};
}

export default api;
