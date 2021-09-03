const fetch = require("node-fetch");

const base_url = "https://discord.com/api/v9/";
const cdn_base_url = "https://cdn.discordapp.com/";

const user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36";

module.exports = function(client_token) {
	//public
	this.gateway = new (require("./gateway.js"))(client_token, user_agent);

	//gateway stuff
	this.requestCurrentState = async (raw = false) => await new Promise(
		(resolve, reject) => this.gateway.on("READY", (s) => resolve(s))
	);

	const subscribed_to = {};
	this.subscribeToChannel = async (channel) => await new Promise(
		(resolve, reject) => this.gateway.on("READY", async (s) => {
			const found = s.guild_join_requests.some((x) => channel.guild_id === x.guild_id);
			if(!found) return resolve(null);
			if(subscribed_to[channel.id]) resolve(subscribed_to[channel.id]); //make sure this only happens once
			const json_obj = {
				"op": 14, //SECRET OP FOR ALLOWING EVENTS FROM BIG SERVERS
				"d": {
					"guild_id": channel.guild_id,
					"typing": true,
					"threads": true,
					"activities": true,
					"members": [],
					"channels": {},
					"thread_member_lists":[]
				}
			};
			json_obj.d.channels[channel.id] = [[0,99]];
			subscribed_to[channel.id] = await this.gateway.send(json_obj);
			resolve(subscribed_to[channel.id]);
		})
	);

	//http api
	this.requestGuildDetails = async (id, raw = false) => await httpRequest(`guilds/${id}`, null, "GET", raw);
	this.requestGuildChannels = async (id, raw = false) => await httpRequest(`guilds/${id}/channels`, null, "GET", raw);
	this.requestGuildIconURL = async (guild, format = "png") => `${cdn_base_url}icons/${guild.id}/${guild.icon}.${format}`;
	this.requestGuildInviteDetails = async (code, raw = false) => await httpRequest(`invites/${code}?with_counts=true&with_expiration=true`, null, "GET", raw);
	this.deleteGuildInvite = async (code, raw = false) => await httpRequest(`invites/${code}`, null, "DELETE", raw);
	//this.joinGuild = async (code, raw = false) => await httpRequest(`invites/${code}`, null, "POST", true, raw); //FORCES YOU TO VERIFY YOUR ACCOUNT VIA MOBILE - I THINK IT NEEDS WEBSOCKET
	this.leaveGuild = async (id) => await httpRequest(`users/@me/guilds/${id}`, {lurking: false}, "DELETE");

	this.requestChannelDetails = async (id, raw = false) => await httpRequest(`channels/${id}`, null, "GET", raw);
	this.requestChannelMessages = async (id, raw = false) => await httpRequest(`channels/${id}/messages?limit=50`, null, "GET", raw);

	this.requestYourDetails = async (raw = false) => await httpRequest(`users/@me`, null, "GET", raw);
	this.requestUserProfile = async (id, raw = false) => await httpRequest(`users/${id}/profile?with_mutual_guilds=true`, null, "GET", raw);
	this.requestUserRelationships = async (raw = false) => await httpRequest(`users/@me/relationships`, null, "GET", raw);
	this.requestBlockedUsers = async (raw = false) => {
		const ret = {};
		for(const x of await httpRequest(`users/@me/relationships`, null, "GET")) {
			if(x.type !== 2) continue;
			ret[x.id] = x.user;
		}
		return ret;
	};
	this.requestRemoveBlockUser = async (id, raw = false) => await httpRequest(`users/${id}/relationships`, null, "DELETE", raw);
	this.requestAddBlockUser = async (id, raw = false) => await httpRequest(`users/${id}/relationships`, {type: 2}, "PUT", raw);
	this.requestUserDMChannel = async (id, raw = false) => await httpRequest(`users/@me/channels`, {recipients:[id]}, "POST", raw);
	this.requestAvatarURL = async (user_profile, format = "png") => `${cdn_base_url}avatars/${user_profile.user.id}/${user_profile.user.avatar}.${format}`;
	this.updateSettings = async (json_obj, raw = false) => await httpRequest(`users/@me/settings`, json_obj, "PATCH", raw);

	this.sendMessage = async (id, message, raw = false) => await httpRequest(`channels/${id}/messages`, {content: message, nonce: generateSnowflake(), tts: false}, "POST", raw);

	//private
	const generateSnowflake = () => {
		const epoch = (new Date("2015-01-01")).getTime();
		let ret = BigInt(0);
		ret = ret + (BigInt((new Date()).getTime() - epoch) << 22n);
		ret = ret + (BigInt(1) << 17n);
		ret = ret + (BigInt(1) << 12n);
		ret = ret + BigInt(Math.floor(Math.random() * Math.floor(0xfff)));
		return ret.toString();
	};

	const httpRequest = async (url_path, json_obj = null, method = "GET", raw = false) => {
		const headers = {
			"accept": "*/*",
			"accept-language": "en-US",
			"authorization": client_token,
			"cache-control": "no-cache",
			"pragma": "no-cache",
			"sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"92\"",
			"sec-ch-ua-mobile": "?0",
			"sec-fetch-dest": "empty",
			"sec-fetch-mode": "cors",
			"sec-fetch-site": "same-origin",
			"user-agent": user_agent
		};

		let body_contents = null;
		if(json_obj !== null) {
			headers["content-type"] = "application/json";
			body_contents = JSON.stringify(json_obj);
		}

		const response = await (await fetch(base_url + url_path, {
			headers: headers,
			body: body_contents,
			method: method,
			mode: "cors",
			credentials: "include"
		})).text();

		if(raw) return response;
		return JSON.parse(response);
	};
};
