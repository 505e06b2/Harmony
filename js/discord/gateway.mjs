const websocket_url = "wss://gateway.discord.gg/?encoding=json&v=9";

export function gateway(parent) {
	//public
	parent.state = {};

	const listeners = {};
	parent.on = (type, callback) => {
		if(parent.state.guilds && type === "READY") return callback(parent.state); //already ready :)
		if(listeners[type]) listeners[type].push(callback);
		else listeners[type] = [callback];
	};

	this.dispatchEvent = (type, data) => {
		for(const i in listeners[type]) listeners[type][i](...data);
	};

	this.send = async (x) => socket.send(JSON.stringify(x));

	//private
	const socket = new WebSocket(websocket_url);
	let heartbeatInterval;

	socket.onopen = (e) => {
		if(heartbeatInterval) clearInterval(heartbeatInterval);
		console.log("Connected to Discord Gateway");
	}

	socket.onclose = (e) => {
		if(heartbeatInterval) clearInterval(heartbeatInterval);
		console.log("Discord Gateway connection closed:", "code:", e.code, "reason:", e.reason);
	}

	socket.onmessage = async (e) => {
		const data = JSON.parse(e.data);

		const heartbeat_string = JSON.stringify({op: 1, d: null});
		switch(data.op) {
			case 0:
				switch(data.t) {
					case "READY":
						parent.state = Object.assign({}, data.d);
						break;

					case "READY_SUPPLEMENTAL":
						Object.assign(parent.state, data.d);
						this.dispatchEvent("READY", [parent.state]); //always seems to come after READY + fills in any gaps
						break;

					case "MESSAGE_CREATE":
						this.dispatchEvent(data.t, [data.d]);
						break;

					case "USER_SETTINGS_UPDATE":
						Object.assign(parent.state.user_settings, data.d);
						break;

					default:
						//console.log("Unhandled event:", data.t);
				}
				break;

			case 1:
				await socket.send(heartbeat_string);
				break;

			case 10:
				await socket.send(heartbeat_string);
				heartbeatInterval = setInterval(() => socket.send(heartbeat_string), data.d.heartbeat_interval);

				socket.send(JSON.stringify({
					op: 2,
					d: {
						"token": localStorage.authorization,
						"capabilities": 125,
						"properties": {
							"os": "Windows",
							"browser": "Chrome",
							"device": "",
							"browser_user_agent": parent.user_agent,
							"browser_version": /Chrome\/(.*)\s/.exec(parent.user_agent)[1],
							"os_version": "",
							"referrer": "https://discord.com/login",
							"referring_domain": "discord.com",
							"referrer_current": "",
							"referring_domain_current": "",
							"release_channel": "stable",
							"client_build_number": 95351,
							"client_event_source": null
						},
						"presence": {
							"status": "online",
							"since": 0,
							"activities": [],
							"afk": false
						},
						"compress": false,
						"client_state": {
							"guild_hashes": {},
							"highest_last_message_id": "0",
							"read_state_version": 0,
							"user_guild_settings_version": -1
						}
					}
				}));
				break;

			case 11:
				//heartbeat ack
				break;

			default:
				console.log(data);
		}
	};
}

export default gateway;