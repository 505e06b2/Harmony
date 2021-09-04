import api from "./api.mjs";

function Discord() {
	while(!localStorage.authorization) {
		const value = prompt("Paste your Authorization token:");
		if(!value) continue;
		localStorage.authorization = value;
	}

	//public / shared to children
	this.generateSnowflake = () => {
		const epoch = (new Date("2015-01-01")).getTime();
		let ret = BigInt(0);
		ret = ret + (BigInt((new Date()).getTime() - epoch) << 22n);
		ret = ret + (BigInt(1) << 17n);
		ret = ret + (BigInt(1) << 12n);
		ret = ret + BigInt(Math.floor(Math.random() * Math.floor(0xfff)));
		return ret.toString();
	};

	this.api_base = (location.hostname === "localhost") ? "http://localhost:8080/?" : "https://io-discord-eu1.herokuapp.com/?";
	this.api = new api(this);
}

window.discord = new Discord();
