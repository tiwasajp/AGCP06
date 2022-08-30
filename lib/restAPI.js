/* 
* restAPI.js
* 2017-2022, Tomohiro Iwasa
* This code is licensed under the MIT License
*/

import https from "https";
import http from "http";
import queryString from "querystring";

import { _stdout, _stdout_log, _stdout_table, _stderror } from "./stdout.js";
const DEBUG = true;

export default function(url, options) {
	return new Promise((resolve, reject) => {
		if (DEBUG) _stdout(`restAPI url ${url}`);
		if (DEBUG) _stdout(`restAPI options ${JSON.stringify(options)}`);
		const body = options.body || null;
		if (options.body) {
			delete options.body;
		}
		const timeout = options.timeout || null;
		if (options.timeout) {
			delete options.timeout;
		}
		try {
			const req = (url.startsWith('https:') ? https : http).request(url, options, (resp) => {
				if (DEBUG) _stdout(`restAPI headers: ${JSON.stringify(resp.headers)}`);
				if (DEBUG) _stdout(`restAPI statusCode: ${resp.statusCode}`);
				if (resp.statusCode !== 200) {
					if (DEBUG) _stdout(`restAPI error statusCode ${resp.statusCode}}`);
					reject({ error: `statusCode ${resp.statusCode}` });
					return;
				}
				resp.setEncoding('utf-8');
				let data = "";
				resp.on('data', (chunk) => {
					if (DEBUG) _stdout(`restAPI chunk ${chunk}`);
					data += chunk;
				})
					.on('end', () => {
						if (DEBUG) _stdout(`restAPI data ${data}`);
						if (data) {
							resolve(JSON.parse(data));
						}
						else {
							if (DEBUG) _stdout(`restAPI empty data`);
							resolve(null);
						}
					});
			})
				.on('error', (error) => {
					if (DEBUG) _stdout(`restAPI error ${JSON.stringify(error)}`);
					reject({ error: error });
				})
				.on('timeout', () => {
					req.abort();
					if (DEBUG) _stderror("restAPI Request Timeout");
					reject({ error: "timeout" });
				});
			if (timeout) {
				req.setTimeout(timeout);
			}
			if (body) {
				if (!options.json) {
					req.write(queryString.stringify(body));
				}
				else {
					req.write(JSON.stringify(body));
				}
			}
			req.end();
		}
		catch (error) {
			if (DEBUG) _stderror(`restAPI error ${JSON.stringify(error)}`);
			reject({ error: error });
		}
	});
}

