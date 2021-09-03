const Discord = function() {
	const listeners = {};
	const waitingApiRequests = {};
	let current_request_id = 1; // 1 == true

	this.websocket = new WebSocket(`ws://${location.hostname}:8080`);

	this.on = (type, callback) => {
		if(type === "READY" && this.websocket.readyState === 1) return callback([]);
		if(listeners[type]) listeners[type].push(callback);
		else listeners[type] = [callback];
	};

	this.dispatch = (type, data) => {
		for(const i in listeners[type]) listeners[type][i](...data);
	};

	this.api = async function(funcName) { //function == use arguments
		const id = current_request_id++;
		const args = Array.from(arguments).slice(1);

		return await new Promise((resolve, reject) => {
			waitingApiRequests[id] = resolve;
			this.websocket.send(JSON.stringify({
				id: id,
				funcName: funcName,
				arguments: args
			}));
		});
	};

	this.websocket.onopen = () => {
		this.dispatch("READY", []);
	};

	this.websocket.onmessage = (m) => {
		const data = JSON.parse(m.data);
		if(data.id && data.funcName && waitingApiRequests[data.id]) {
			waitingApiRequests[data.id](data.returned); //resolve promise
			delete waitingApiRequests[data.id];
			return;
		}
		if(data.type === undefined) return; //NOT A DISCORD MESSAGE
		this.dispatch(data.type, [data.content]);
	};
};

const discord = new Discord();
