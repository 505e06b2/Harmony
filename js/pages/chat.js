let messages_container;
let inputbox;

function scrollMessagesAfter(callback = () => undefined) {
	if(!messages_container) return;
	const maxScrollValue = () => messages_container.scrollHeight - messages_container.clientHeight;
	const shouldScroll = (messages_container.scrollTop >= maxScrollValue() - 20);
	const ret = callback();
	if(shouldScroll) messages_container.scrollTop = maxScrollValue();
	return ret;
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
		const elem = createElement("div", {id: message.id, className: "message"});
		elem.setAttribute("timestamp", message.timestamp);

			const contents = createElement("span", {className: "contents"},
				createElement("span", {
					className: "username",
					innerText: " " + message.author.username + " ", //so double click will work on username
					title: message.author.id,
					style: `color: hsl(${parseInt(message.author.id)%360}, 100%, var(--username-hsl-brightness))`
				}),
				createElement("span", {
					className: "text",
					innerHTML: (parsed_contents) ? parsed_contents + "<br>" : ""
				})
			);

			if(message.attachments.length === 1) { //more than 1 = malicious bot :)
				const x = message.attachments[0];
				contents.append(
					createElement("span", {className: "attachments"},
						//"File: ",
						createElement("a", {
							className: "attachment",
							innerText: x.filename,//"Attachment", //typeOfAttachmentFromExtension(x.filename);
							title: x.filename,
							href: x.url,
							target: "_blank"
						})
					)
				);
			}

			const date_obj = new Date(message.timestamp);
			elem.append(
				createElement("span", {
					className: "timestamp",
					innerText: "[" + (""+date_obj.getHours()).padStart(2, '0') + ":" + (""+date_obj.getMinutes()).padStart(2, '0') + "]",
					title: new Intl.DateTimeFormat(navigator.language, {dateStyle: "full", timeStyle: "medium"}).format(date_obj)
				}),
				contents
			);
		messages_container.append(elem);
	});
}

//main
(async () => {
	const container = createElement("span", {id: "pages-chat"});

	const messages = await discord.api.getMessages(channel.id);
	messages_container = createElement("div", {className: "messages"});
	for(const x of messages.reverse()) {
		appendMessage(x);
	}

	inputbox = createElement("div", {
		contentEditable: true,
		className: "composer",
		oninput: (e) => {
			messages_container.scrollTop = messages_container.scrollHeight;
		},
		onkeydown: (e) => {
			e.stopPropagation();
			switch(e.key) {
				case "Enter":
					if(!e.shiftKey) { //enter still = newline, just only with shift held
						e.preventDefault();
						discord.api.sendMessage(channel.id, inputbox.innerText);
						inputbox.innerText = "";
						messages_container.scrollTop = messages_container.scrollHeight;
					}
					break;
			}
		},
		onpaste: (e) => {
			e.stopPropagation();
			e.preventDefault();

			if(e.clipboardData.files[0]) {
				discord.api.sendFileMessage(channel.id, e.clipboardData.files[0]);
			} else {
				window.document.execCommand("insertText", false, e.clipboardData.getData("text")); // :(
			}
			return true;
		}
	}); //global

	inputbox.setAttribute("channel-name", channel.name);
	//inputbox.placeholder = "Message..."; done via CSS now

	container.append(messages_container, inputbox);

	document.body.innerHTML = "";
	document.body.append(container);
	messages_container.scrollTop = messages_container.scrollHeight;
	inputbox.focus();

	//events

	//software keyboard appears
	window.onresize = () => {
		if(messages_container) messages_container.scrollTop = messages_container.scrollHeight;
	};

	window.onkeydown = (e) => {
		if(!inputbox || e.ctrlKey || document.activeElement === inputbox) return;
		inputbox.focus();
		document.execCommand("selectAll", false, null);
		document.getSelection().collapseToEnd();
		inputbox.dispatchEvent(new e.constructor(e.type, e));
	};

	window.onfocus = () => {
		inputbox.focus();
	}
})();
