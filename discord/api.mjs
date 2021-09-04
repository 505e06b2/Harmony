const api_base = (location.hostname === "localhost") ? "http://localhost:8080/?" : "https://io-discord-eu1.herokuapp.com/?";

export function api(parent) {
	this.send = async (channel_id, message) => await this.raw(
		`channels/${channel_id}/messages`,
		"POST",
		{"content-type": "application/json"},
		JSON.stringify({content: message, nonce: parent.generateSnowflake(), tts: false})
	);

	this.raw = async (path, method="GET", headers={}, body=null) => {
		const r = await fetch(api_base + path, {
			method: "POST",
			headers: Object.assign({
				"authorization": localStorage.authorization
			}, headers),
			body: body
		});
		return await r.json(); //no need for text()?
	};
}

export default api;
