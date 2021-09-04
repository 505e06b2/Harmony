export function api(parent) {
	this.send = async (channel_id, message) => await this.raw(
		`channels/${channel_id}/messages`,
		"POST",
		{"content-type": "application/json"},
		JSON.stringify({content: message, nonce: parent.generateSnowflake(), tts: false})
	);

	this.raw = async (path, method="GET", headers={}, body=null) => {
		const r = await fetch(parent.api_base + path, {
			method: "POST",
			headers: Object.assign({
				"authorization": localStorage.authorization
			}, headers),
			body: body,
			mode: "cors",
			cache: "no-cache",
			credentials: "include"
		});
		console.log(r);
		return await r.text(); //no need for text()?
	};
}

export default api;
