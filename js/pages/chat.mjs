let messages_container;
let inputbox;

//WINDOW_OBJECT IS JUST WEIRD.

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
					a_tag.innerText = "Attachment";//typeOfAttachmentFromExtension(x.filename);
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

export async function chat(channel, window_object = null) {
	const container = this.createElement("span", {id: "pages-chat"});

	const messages = await this.discord.api.getMessages(channel.id);
	messages_container = document.createElement("div");
	messages_container.className = "messages";
	for(const x of messages.reverse()) {
		appendMessage(x);
	}

	inputbox = document.createElement("div"); //global
		inputbox.contentEditable = true;
		inputbox.className = "composer";
		inputbox.setAttribute("channel-name", channel.name);
		//inputbox.placeholder = "Message..."; done via CSS now
		inputbox.onkeydown = (e) => {
			e.stopPropagation();
			switch(e.key) {
				case "Enter":
					if(!e.shiftKey) { //enter still = newline, just only with shift held
						e.preventDefault();
						this.discord.api.sendMessage(channel.id, inputbox.innerText);
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

			if(e.clipboardData.files[0]) {
				discord.api.sendFileMessage(channel.id, e.clipboardData.files[0]);
			} else {
				window_object.document.execCommand("insertText", false, e.clipboardData.getData("text")); // :(
			}
			return true;
		};

	container.append(messages_container, inputbox);

	if(window_object) {
		window_object.appendMessage = appendMessage; //used by event

		//software keyboard appears
		window_object.onresize = () => {
			if(messages_container) messages_container.scrollTop = messages_container.scrollHeight;
		};

		window_object.onkeydown = (e) => {
			if(!inputbox || e.ctrlKey) return;
			inputbox.focus();
			document.execCommand("selectAll", false, null);
			document.getSelection().collapseToEnd();
			inputbox.dispatchEvent(new e.constructor(e.type, e));
		};

		const onloadObserver = new MutationObserver((mutationsList, observer) => {
			for(const mutation of mutationsList) {
				switch(mutation.type) {
					case "childList":
						messages_container.scrollTop = messages_container.scrollHeight;
						inputbox.focus();
						onloadObserver.disconnect();
						break;
				}
			};
		});
		onloadObserver.observe(window_object.document.body, {childList: true});

		window_object.onfocus = () => {
			inputbox.focus();
		}
	}
	return container;
}

export default chat;
