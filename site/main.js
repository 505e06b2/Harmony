const connection = (() => {
	const params = (new URL(window.location)).searchParams;
	for(const x of ["user", "channel"]) {
		const param_value = params.get(x);
		if(!param_value) continue;
		return {
			type: x,
			id: param_value,
			channel_id: 0, //set .on("ready")
			channel_name: ""
		};
	}
	alert("No parameters given, quiting");
	throw "No parameters given";
})();
let messages_container;
let inputbox;

function typeOfAttachmentFromExtension(filename) {
	const s = filename.split(".");
	if(s.length < 2) return "Attachment";
	switch(s.slice(-1)[0].toLowerCase()) {
		case "png":
		case "jpg":
		case "jpeg":
		case "gif":
		case "ico":
		case "bmp":
		case "webp":
		case "tiff":
		case "tif":
		case "avif":
		case "apng":
			return "Image Attachment";

		case "svg":
			return "Vector Image Attachment";

		case "mp4":
		case "webm":
		case "ogv":
		case "mpeg":
		case "avi":
		case "3gp":
		case "3g2":
			return "Video Attachment";

		case "mp3":
		case "aac":
		case "wav":
		case "ogg":
		case "oga":
		case "vorbis":
		case "opus":
		case "weba":
			return "Audio Attachment";

		case "zip":
		case "tar":
		case "bz":
		case "bz2":
		case "gz":
		case "rar":
		case "7z":
			return "Archive Attachment";

		case "txt":
			return "Plain Text Attachment";

		case "swf":
			return "Friggin Sick SWF Attachment"; // :)

		case "ts": //could be video, could be """""typescript"""""
		default:
			return "Attachment";
	}
}

function scrollMessagesAfter(callback = () => undefined) {
	if(!messages_container) return;
	const maxScrollValue = () => messages_container.scrollHeight - messages_container.clientHeight;
	const shouldScroll = (messages_container.scrollTop >= maxScrollValue() - 20);
	const ret = callback();
	if(shouldScroll) messages_container.scrollTop = maxScrollValue();
	return ret;
}

function createSpan(className, callback) {
	const e = document.createElement("span");
	if(className) e.className = className;
	if(callback) callback(e);
	return e;
}

function parseMessage(text) {
	if(text.startsWith("https://tenor.com/view/")) return; //9gag go home
	text = text.replace(/<a?[@:#].*?>\s*/gm, "");//no mentions, no cross-server emoji
	//text = text.replace(/\S{50,}/gm, ""); //remove non-words longer or equal to n
	text = text.replace(/&/gm, "&amp;").replace(/</gm, "&lt;").replace(/>/gm, "&gt;"); //html tag escape

	const replaceAllMatches = (regex, replaceWith) => {
		const matches = text.match(regex);
		if(matches) {
			for(const x of matches) {
				text = text.replace(x, replaceWith.replace(/\${x}/gm, x));
			}
		}
	};

	replaceAllMatches(/https?:\/\/\S*?(?=`|$|\s)/mg, '<a href="${x}" target="_blank">${x}</a>'); //http links
	replaceAllMatches(/^&gt;.*?$/mg, '<span class="greentext">${x}</span>'); //greentext
	replaceAllMatches(/^&lt;.*?$/mg, '<span class="redtext">${x}</span>'); //redtext

	return text.trim().replace(/\n/gm, "<br>");
}

function appendMessage(message) {
	const parsed_contents = parseMessage(message.content);
	if(!parsed_contents && !message.attachments.length) return; //no content at all

	scrollMessagesAfter(() => {
		const elem = document.createElement("div");
			elem.id = message.id;
			elem.className = "message";
			elem.setAttribute("timestamp", message.timestamp);

			const contents = document.createElement("span");
			contents.className = "contents";
			contents.append(
				createSpan("username", (x) => {
						x.innerText = " " + message.author.username + " "; //so double click will work on username
						x.title = message.author.id;
						x.style.color = `hsl(${parseInt(message.author.id)%360}, 100%, var(--username-hsl-brightness))`;
					}),

				createSpan("text", (x) => x.innerHTML = parsed_contents)
			);

			if(message.attachments) {
				const attachments_elem = document.createElement("div");
				attachments_elem.className = "attachments";
				for(const x of message.attachments) {
					const a_tag = document.createElement("a");
					a_tag.className = "attachment";
					a_tag.innerText = typeOfAttachmentFromExtension(x.filename);
					a_tag.title = x.filename;
					a_tag.href = x.url;
					a_tag.target = "_blank";
					attachments_elem.append(a_tag);
				}
				contents.append(attachments_elem);
			}

			elem.append(
				createSpan("timestamp", (x) => {
					const date_obj = new Date(message.timestamp);
					x.innerText = "[" + new Intl.DateTimeFormat(navigator.language, {timeStyle: "short"}).format(date_obj) + "]";
					x.title = new Intl.DateTimeFormat(navigator.language, {dateStyle: "full", timeStyle: "medium"}).format(date_obj);
				}),

				contents
			);
		messages_container.append(elem);
	});
}

//software keyboard appears
window.onresize = () => {
	if(messages_container) messages_container.scrollTop = messages_container.scrollHeight;
};

window.onkeydown = (e) => {
	if(!inputbox || e.ctrlKey) return;
	inputbox.focus();
	document.execCommand("selectAll", false, null);
	document.getSelection().collapseToEnd();
	inputbox.dispatchEvent(new e.constructor(e.type, e));
};

window.onoffline = () => {
	console.warn("Went offline, reloading messages when connectivity is regained");
	window.ononline = async () => {
		window.ononline = null;
		console.warn("Back online, reloading messages");

		let i = 1;
		let interval;
		const f = async () => {
			console.warn("Attempt", i++);
			const messages = await discord.api("requestChannelMessages", connection.channel_id);
			if(!messages) return;
			clearInterval(interval);

			messages_container.innerHTML = "";
			for(const x of messages.reverse()) {
				appendMessage(x);
			}
		};
		interval = setInterval(f, 1000);
	}
};

//Discord Events
discord.on("READY", async (message) => {
	switch(connection.type) {
		case "user": {
			const profile = await discord.api("requestUserProfile", connection.id);
			document.title = profile.user.username;
			document.querySelector('link[rel="icon"]').href = await discord.api("requestAvatarURL", profile);
			connection.channel_id = (await discord.api("requestUserDMChannel", profile.user.id)).id;
			connection.channel_name = profile.user.username;
		} break;

		case "channel": {
			const channel = await discord.api("requestChannelDetails", connection.id);
			discord.api("subscribeToChannel", channel); //force events for big servers
			const guild = await discord.api("requestGuildDetails", channel.guild_id);
			document.title = "#" + channel.name + " | " + guild.name;
			document.querySelector('link[rel="icon"]').href = await discord.api("requestGuildIconURL", guild);
			connection.channel_id = channel.id;
			connection.channel_name = channel.name;
		} break;
	}

	const messages = await discord.api("requestChannelMessages", connection.channel_id);
	messages_container = document.createElement("div");
	messages_container.className = "messages";
	for(const x of messages.reverse()) {
		appendMessage(x);
	}

	inputbox = document.createElement("div"); //global
		inputbox.contentEditable = true;
		inputbox.className = "composer";
		inputbox.setAttribute("channel-name", connection.channel_name);
		//inputbox.placeholder = "Message..."; done via CSS now
		inputbox.onkeydown = (e) => {
			e.stopPropagation();
			switch(e.key) {
				case "Enter":
					if(!e.shiftKey) { //enter still = newline, just only with shift held
						e.preventDefault();
						discord.api("sendMessage", connection.channel_id, inputbox.innerText);
						inputbox.innerText = "";
						messages_container.scrollTop = messages_container.scrollHeight;
					}
					break;
			}
		};

		inputbox.oninput = (e) => {
			messages_container.scrollTop = messages_container.scrollHeight;
		};

		inputbox.onpaste = (e) => {
			e.stopPropagation();
			e.preventDefault();
			document.execCommand("insertText", false, e.clipboardData.getData("Text"));
			return true;
		};

	const container = document.querySelector('#discord-container');
	container.innerHTML = "";
	container.append(messages_container);
	container.append(inputbox);
	messages_container.scrollTop = messages_container.scrollHeight;
	inputbox.focus();
});

discord.on("MESSAGE_CREATE", (message) => {
	if(messages_container === undefined || message.channel_id !== connection.channel_id) return;
	appendMessage(message);
});
