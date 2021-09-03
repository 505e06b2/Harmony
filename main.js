#!/usr/bin/env nodejs

const site_folder = "site";
const http_port = 8080;

const http = require("http");
const path = require("path");
const fs = require("fs");

const mimetypes = {
	"html": "text/html",
	"css": "text/css",
	"js": "text/javascript",
	"json": "application/json"
};

function printError(e, attempting_to_do, data_object) {
	console.error("ERROR", attempting_to_do, data_object, "\n", e.stack);
}

const api = new (require("./api"))("ODgxMjMxOTU1NTgzMTgwODAy.YSp2Sw.kEDZN1Heh5wBw60STqHNSm-fn9o");
api.gateway.on("READY", async (state) => {
	const connected_clients = [];

	api.gateway.on("MESSAGE_CREATE", (message) => {
		const send_str = JSON.stringify({
			type: "MESSAGE_CREATE",
			content: message
		});
		for(const x of connected_clients) x.send(send_str);
	});

	const http_server = http.createServer(async (request, response) => {
		const url = new URL(request.url, `http://${request.headers.host}`);
		const split_pathname = url.pathname.split("/").filter(Boolean);
		switch(split_pathname[0]) {
			case "user": {
				const content = await api.requestUserProfile(split_pathname[1], true);
				response.writeHead(200, {
					"Content-Length": Buffer.byteLength(content),
					"Content-Type": mimetypes["json"]
				});
				response.write(content);
				response.end();
				break;
			}

			default: {
				const file_name = (url.pathname === "/") ? "index.html" : url.pathname;
				try {
					const file_contents = fs.readFileSync(path.join(site_folder, file_name));
					response.writeHead(200, {
						"Content-Length": file_contents.length,
						"Content-Type": mimetypes[file_name.split(".").slice(-1)]
					});
					response.write(file_contents);
					response.end();
				} catch {
					response.writeHead(404).end();
				}
			}
		}
	});

	const websocket_server = new (require("ws").Server)({server: http_server});

	websocket_server.on("connection", (client) => {
		connected_clients.push(client);

		client.on("close", () => {
			const index = connected_clients.indexOf(client);
			connected_clients.splice(index, 1);
		});

		client.on("message", async (raw) => {
			let data;
			try {
				data = JSON.parse(raw);
			} catch(e) {printError(e, "message", raw);}

			if(data.funcName === undefined || data.arguments === undefined) return;

			let return_value = null;
			try {
				return_value = await api[data.funcName](...data.arguments);
			} catch(e) {printError(e, data.funcName, raw);}
			client.send(JSON.stringify({
				id: data.id,
				funcName: data.funcName,
				arguments: data.arguments,
				returned: return_value
			}));
		});
	});

	http_server.listen(http_port);
	console.log(`HTTP/WS server running on port ${http_port}`);

	/*
	for(const x of (await api.requestCurrentState()).guild_join_requests) { //only exist for big guilds?
		if(x.application_status !== "STARTED") continue;
		for(const channel of await api.requestGuildChannels(x.guild_id)) {
			if(channel.type === 0 && channel.name === "general") {
				api.enableEventsOnHugeGuildChannel(channel);
				break;
			}
		}
	}
	*/
	//await api.enableEventsOnHugeGuildChannel()
	//console.log(state);
	//await api.updateSettings({developer_mode: false});
	//console.log(api.gateway.state.user_settings);
});
