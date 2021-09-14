import guilds from "./guilds.mjs";
import chat from "./chat.mjs";

export function Pages(discord) {
	this.createElement = (tag_name, attributes={}, ...append) => {
		const ret = Object.assign(document.createElement(tag_name), attributes);
		if(append) ret.append(...append);
		return ret;
	};

	const childThis = {
		createElement: this.createElement,
		discord: discord
	};

	this.guilds = guilds.bind(childThis); //function() {return guilds.apply(self, arguments)}; //this in guilds = here
	this.chat = chat.bind(childThis); //function() {return chat.apply(self, arguments)}; //this in chat = here
}

export default Pages;
