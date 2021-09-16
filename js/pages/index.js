//helper functions for js/pages/*.js

function createElement(tag_name, attributes={}, ...append) {
	const ret = Object.assign(document.createElement(tag_name), attributes);
	if(append) ret.append(...append);
	return ret;
};

function addPageToDOM(name, window_proxy=null) {
	(window_proxy || window).document.head.append(
		createElement("link", {
			rel: "stylesheet",
			href: `css/pages-${name}.css`
		}),
		createElement("script", {
			src: `js/pages/${name}.js`
		}),
	);
}
