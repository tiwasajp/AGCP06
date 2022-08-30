/* 
* $ restAPI.js
* 2017-2022, Tomohiro Iwasa
* This code is licensed under the MIT License
*/

/*
ANSI_RESET = "\u001B[0m";
ANSI_BLACK = "\u001B[30m";
ANSI_RED = "\u001B[31m";
ANSI_GREEN = "\u001B[32m";
ANSI_LIGHT_YELLOW = "\u001B[93m";
ANSI_YELLOW = "\u001B[33m";
ANSI_YELLOW_BACKGROUND = "\u001B[43m";
ANSI_BLUE = "\u001B[34m";
ANSI_PURPLE = "\u001B[35m";
ANSI_CYAN = "\u001B[36m";
ANSI_WHITE = "\u001B[37m";
ANSI_BOLD = "\u001B[1m";
ANSI_UNBOLD = "\u001B[21m";
ANSI_UNDERLINE = "\u001B[4m";
ANSI_STOP_UNDERLINE = "\u001B[24m";
ANSI_BLINK = "\u001B[5m";
*/

import dateutils from "date-utils";

export function _stdout(text) {
	let title = text.substr(0, text.indexOf(' '));
	let content = text.substr(text.indexOf(' ') + 1);
	console.log(`\u001b[36m${(new Date()).toFormat("YYYY/MM/DD HH24:MI:SS")} \u001b[33m${title} \u001b[0m${content}`);
};

export function _stdout_log(obj) {
	console.log(obj);
};

export function _stdout_table(obj) {
	console.table(obj);
};

export function _stderror(text) {
	console.error(`\u001b[36m${(new Date()).toFormat("YYYY/MM/DD HH24:MI:SS")} \u001b[0m${text}`);
};
