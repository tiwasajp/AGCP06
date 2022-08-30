// Tomohiro Iwasa, Avaya Japan, 2017-2022
// Updated: 20220828

(async (window, $) => {
	'use strict';

	var socket = io.connect();
	
	var header = (client, channel, messageId) => {
		return {
			userId: client.userId, room: client.room, type: client.type, mode: client.mode, channel: channel, messageId: (!messageId ? messageId : Math.random().toString(16).slice(2)), ticker: (new Date())
		};
	}

	var cmsp = {
		client: {
			clientId: `1000${('0' + (new Date()).getMinutes()).slice(-2)}${('0' + (new Date()).getSeconds()).slice(-2)}`, userId: "", type: "", mode: "", password: "should_be_encrypted", room: "", data: [],
		}
	};

	var arg = new Object;
	var pair = location.search.substring(1).split("&");
	for (var i = 0; pair[i]; i++) {
		var keyValue = pair[i].split("=");
		arg[keyValue[0]] = keyValue[1];
	}

	if (arg.userId) {
		cmsp.client.userId = arg.userId;
	}

	if (arg.room) {
		cmsp.client.room = arg.room;
	}

	console.log(`[INFO] cmsp.client.userId:${cmsp.client.userId}`);
	console.log(`[INFO] cmsp.client.room:${cmsp.client.room}`);

	if (!cmsp.client.userId) {
		alert("No userId identified.")
	}

	const webRTC = new WebRTC();
	const socket_emit_webrtc = (data) => { socket.emit("webrtc", { header: header(cmsp.client, "webrtc", ""), body: data }); };
	window.socket_emit_webrtc = socket_emit_webrtc;
	webRTC.init("#LocalVideoMedia", "#RemoteVideoMedia");
	socket.on("webrtc", (message) => {
		if (message.header.userId !== cmsp.client.userId) {
			webRTC.on(message);
		}
	});
	
	socket.on("session", (message) => {
		console.log(`[INFO] socket.on(session) ${JSON.stringify(message)}`);
		if (message.action === "join") {
			if (message.userId !== cmsp.client.userId) {
				;
			}
		}
		else if (message.action === "leave") {
			if (message.userId !== cmsp.client.userId) {
				if (webRTC.getPeerConnection()) {
					webRTC.hangUp("close");
				}
			}
			else {
				;
			}
		}
	});

	socket.on("close", (message) => {
		console.log(`[INFO] socket.on(close) ${JSON.stringify(message)}`);
	});

	socket.on("data", (message) => {
		console.log(`[socket.on(data)] ${JSON.stringify(message)}`);
		switch (message.body.media.type) {
			case "stream": {
				if (message.header.userId === cmsp.client.userId) {
					if (webRTC.getPeerConnection()) webRTC.hangUp();
					webRTC.startVideo(true);
				}
				else {
					if (webRTC.getPeerConnection()) webRTC.hangUp();
					webRTC.startVideo(false);
				}
				break;
			}
		}
	});

	$("#stream").click(() => {
		if (webRTC.getPeerConnection()) webRTC.hangUp();
		socket.emit("data", { header: header(cmsp.client, "", ""), body: { media: { type: "stream" } } });
	});

	window.onload = (e) => {
		console.log(`[INFO] var onload ${JSON.stringify(e)}`);
		if (cmsp.client.userId) {
			socket.emit("session", { action: "join", userId: cmsp.client.userId, password: cmsp.client.password, type: cmsp.client.type, mode: cmsp.client.mode });
			webRTC.init("#LocalVideoMedia", "#RemoteVideoMedia");
		}
	};

	window.onbeforeunload = (e) => {
		console.log(`[INFO] var onbeforeunload ${JSON.stringify(e)}`);
		if (webRTC.getPeerConnection()) webRTC.hangUp();
		socket.emit("session", { action: "leave", userId: cmsp.client.userId });
	};

})(window, jQuery);

