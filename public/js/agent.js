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
			case "image": {
				/*
				if (message.body.media.src) {
					let image = new Image();
					image.src = message.body.media.src;
					image.onload = () => {
						var width = image.width;
						var height = image.height;
						const max_image_width = 400;
						if (width > max_image_width) {
							width = max_image_width;
							height = image.height * (max_image_width / image.width);
						}
						imagePad.canvas.width = width;
						imagePad.canvas.height = height;
						console.log(`imagePad.canvas width:${imagePad.canvas.width} height:${imagePad.canvas.height}`);
						imagePad.canvas.getContext("2d").drawImage(image, 0, 0, imagePad.canvas.width, imagePad.canvas.height);
						let rect = imagePad.canvas.getBoundingClientRect();
						console.log(`rect ${JSON.stringify(rect)}`);
						imagePad.rect = { left: Math.floor(rect.left), top: Math.floor(rect.top), right: Math.floor(rect.right), bottom: Math.floor(rect.bottom), width: Math.floor(rect.width), height: Math.floor(rect.height) };
						console.log(`imagePad.rect ${JSON.stringify(imagePad.rect)}`);
					}
				}
				*/
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

	const imagePad = {
		canvas: document.getElementById("imagePad"),
		context: document.getElementById("imagePad").getContext("2d"),
		mouse: { mouseDown: false, currPosition: { x: 0, y: 0 }, lastPosition: { x: 0, y: 0 } },
		org_src: null,
		src: null,
		rect: { left: 0, top: 0, width: 0, height: 0 },
	};

	window.imagePad_circle = (x, y) => {
		imagePad.context.beginPath();
		imagePad.context.arc(x, y, 20, 0, 2 * Math.PI);
		imagePad.context.strokeStyle = '#0f0';
		imagePad.context.lineWidth = 2.0;
		imagePad.context.stroke();
	}

	window.imagePad_line = (x1, y1, x2, y2) => {
		imagePad.context.beginPath();
		imagePad.context.moveTo(x1, y1);
		imagePad.context.lineTo(x2, y2);
		imagePad.context.strokeStyle = '#0f0';
		imagePad.context.lineWidth = 2.0;
		imagePad.context.stroke();
	}

	const sendImageDataToFile = (filename, id) => {
		var dfd = $.Deferred();
		var data = { imageData: document.getElementById(id).toDataURL() };
		$.ajax({
			url: `https://aura.uxportal.jp/postImageDataToFile?file=${filename}`,
			method: 'POST',
			cache: 'no-store',
			dataType: 'json',
			data: data,
			timeout: 5000,
			success: (data) => {
				console.log(`[sendFileData] success ${JSON.stringify(data)}`);
				dfd.resolve(data);
			},
			error: (error) => {
				console.log(`[sendFileData] error ${error.statusText}`);
				dfd.reject(error.statusText);
			}
		});
		return dfd.promise();
	};

	$("#view-video-remote").click(async () => {
		if (!webRTC.getPeerConnection()) return;
		const video = document.getElementById("RemoteVideoMedia");
		imagePad.canvas.width = video.videoWidth;
		imagePad.canvas.height = video.videoHeight;
		imagePad.canvas.getContext("2d").drawImage(video, 0, 0, imagePad.canvas.width, imagePad.canvas.height);
		await sendImageDataToFile("temp.png", "imagePad").then(async () => {
			socket.emit("data", { header: header(cmsp.client, "", ""), body: { media: { type: "image", file: "temp.png" } } });
			$("#ccai").empty();
			$("#please-wait").empty().append(`<div class="neo-spinner neo-spinner--x-large" style="margin: 50px;"></div>`);
		});
	});

	const imageDropTarget = document.getElementById("form-workspace");
	imageDropTarget.addEventListener("dragover", (e) => {
		e.preventDefault();
		e.stopPropagation();
		e.dataTransfer.dropEffect = "copy";
	});

	imageDropTarget.addEventListener("drop", (e) => {
		e.stopPropagation();
		e.preventDefault();
		const reader = new FileReader();
		reader.onload = (e) => {
			var image = new Image();
			image.src = e.target.result;
			const deferred = new $.Deferred();
			image.onload = async () => {
				var width = image.width;
				var height = image.height;
				const max_image_width = 640;
				if (width > max_image_width) {
					width = max_image_width;
					height = image.height * (max_image_width / image.width);
				}
				imagePad.canvas.width = width;
				imagePad.canvas.height = height;
				console.log(`imagePad.canvas width:${imagePad.canvas.width} height:${imagePad.canvas.height}`);
				imagePad.canvas.getContext("2d").drawImage(image, 0, 0, imagePad.canvas.width, imagePad.canvas.height);
				deferred.resolve();
			}
			deferred.promise().then(async () => {
				await sendImageDataToFile("temp.png", "imagePad").then(() => {
					socket.emit("data", { header: header(cmsp.client, "", ""), body: { media: { type: "image", file: "temp.png" } } });
					$("#ccai").empty();
					$("#please-wait").empty().append(`<div class="neo-spinner neo-spinner--x-large" style="margin: 50px;"></div>`);
				});
			});
		}
		reader.readAsDataURL(e.dataTransfer.files[0]);
	});

	window.openWebpageInFrame = (url) => {
		var html = `<div style="position:fixed;top:100px;left:400px;">
				<div class="neo-modal__background"></div>
				<div class="neo-modal__content" aria-modal="true" role="dialog">
				<div class="neo-modal__info-close"><button class="neo-close" onclick="$('#WikiFrame').empty();"/></div>
				<div class="neo-modal__body">
					<iframe src='${url}' style='width:1000px;height:680px;border:none;'></iframe>
				</div>
  			</div>`;
		$("#WikiFrame").empty().append(html);
	}

	socket.on("ccai", (message) => {
		console.log(`[socket.on(ccai)] ${JSON.stringify(message)}`);
		$("#please-wait").empty();
		$("#ccai").empty().append("<div id='WikiFrame' style='position:fixed;left:500px;top:70px;'></div>");

		if (message.ccai.segmentLabelAnnotations && message.ccai.segmentLabelAnnotations.length) {
			$("#ccai").append("<div style='font-size:15px;'><font style='color:blue;font-size:15p;font-weight:bold;'>● Detected Labels (Video API - Detect Objects):</font></div>");
			var annotations = "<table style='font-size:13px;background-color:#eee;width:100%;'>";
			annotations += "<tr><th style='width:300px;'>Label</th><th style='width:150px;'>Start Time</th><th style='width:150px;'>End Time</th></tr>";
			message.ccai.segmentLabelAnnotations.forEach((label) => {
				//console.log(label.entity.description + " at ");
				label.segments.forEach(segment => {
					segment = segment.segment;
					if (segment.startTimeOffset.seconds === undefined) {
						segment.startTimeOffset.seconds = 0;
					}
					if (segment.startTimeOffset.nanos === undefined) {
						segment.startTimeOffset.nanos = 0;
					}
					if (segment.endTimeOffset.seconds === undefined) {
						segment.endTimeOffset.seconds = 0;
					}
					if (segment.endTimeOffset.nanos === undefined) {
						segment.endTimeOffset.nanos = 0;
					}
					annotations += `<tr><td><a onclick='openWikiFrame(\"${label.entity.description}\");'><font color=blue>${label.entity.description}</font></a></td><td>${segment.startTimeOffset.seconds}.${(segment.startTimeOffset.nanos / 1e6).toFixed(0)}s</td><td>${segment.endTimeOffset.seconds}.${(segment.endTimeOffset.nanos / 1e6).toFixed(0)}s</td></tr>`;
				});
			});
			annotations += "</table>";
			$("#ccai").append(`<div style='padding:10px;font-size:13px;background-color:#eee;'>${annotations}</div>`);
			$("#ccai").append("<br/>");
		}

		if (message.ccai.transcription && message.ccai.transcription.length) {
			$("#ccai").append("<div style='margin-bottom:5px;font-size:15px;'><font style='color:blue;font-size:15p;font-weight:bold;'>● Transcript (Speech API - Video Transcript):</font></div>");
			$("#ccai").append(`<div style='padding:10px;font-size:13px;color:blue;background-color:#eee;'>${message.ccai.transcription}</div>`);
			$("#ccai").append("<br/>");
			$("#transcription").empty().append(`<div style='padding:10px;font-size:13px;color:blue;background-color:#eee;'>${message.ccai.transcription}</div>`);
		}

		if (message.ccai.texts && message.ccai.texts.length) {
			$("#ccai").append("<div style='margin-bottom:5px;font-size:15px;'><font style='color:blue;font-size:15p;font-weight:bold;'>● Detected Text (Vision API - OCR):</font></div>");
			$("#ccai").append(`<div style='padding:10px;font-size:17px;font-weight:bold;color:blue;background-color:#eee;'>${message.ccai.texts[0].text}</div>`);
			$("#ccai").append("<br/>");
		}

		if (message.ccai.dialogflow && message.ccai.dialogflow.response !== "") {
			$("#ccai").append("<div style='margin-bottom:5px;font-size:15px;'><font style='color:blue;font-size:15p;font-weight:bold;'>● Topic Analysis (Natural Langage API/Dialogflow Intents/Entities- Detect Text Intent):</font></div>");
			$("#ccai").append(`<div style='padding:10px;font-size:13px;background-color:#eee;'>${message.ccai.dialogflow.queryText} <a onclick='openWebpageInFrame(\"${message.ccai.dialogflow.url}\")'><font color=blue> (${message.ccai.dialogflow.intent.displayName}) → ${message.ccai.dialogflow.fulfillmentText}</a></div>`);
			$("#ccai").append("<br/>");
		}

		if (message.ccai.translations && message.ccai.translations.length) {
			$("#ccai").append("<div style='margin-bottom:5px;font-size:15px;'><font style='color:blue;font-size:15p;font-weight:bold;'>● Translation (Natural Langage API - Translate Text):</font></div>");
			$("#ccai").append(`<div style='padding:10px;font-size:17px;color:blue;background-color:#eee;' >${message.ccai.translations[0].translatedText}</div>`);
			$("#ccai").append("<br/>");
		}

		if (message.ccai.syntax && message.ccai.syntax.tokens.length) {
			$("#ccai").append("<div style='margin-bottom:5px;font-size:15px;'><font style='color:blue;font-size:15p;font-weight:bold;'>● Syntax (Natural Langage API - Analyze Text Syntax):</font></div>");
			var syntax = "";
			for (var i in message.ccai.syntax.tokens) {
				syntax += `${(message.ccai.syntax.tokens[i].partOfSpeech.tag === "NOUN" ?
					"<font color=blue>" + message.ccai.syntax.tokens[i].text.content + " </font>" :
					(message.ccai.syntax.tokens[i].partOfSpeech.tag === "VERB" ?
						"<font color=red>" + message.ccai.syntax.tokens[i].text.content + " </font>" :
						"<font color=black>" + message.ccai.syntax.tokens[i].text.content + " </font>"))}`;
			}
			$("#ccai").append(`<div style='padding:10px;font-size:13px;background-color:#eee;'>${syntax}</div>`);
			$("#ccai").append("<br/>");
		}

		if (message.ccai.entitySentiment && message.ccai.entitySentiment.entities.length) {
			$("#ccai").append("<div style='margin-bottom:5px;font-size:15px;'><font style='color:blue;font-size:15p;font-weight:bold;'>● Entity and Sentiment (Natural Langage API - Detect Entity and Sentiment):</font></div>");
			var entities = "<table style='font-size:13px;background-color:#eee;width:100%;'>";
			entities += "<tr><th style='width:300px;'>Entity</th><th style='width:200px;'>Type</th><th style='width:100px;text-align:center;'>Salience</th><th style='width:100px;text-align:center;'>Magnitude</th><th style='width:100px;text-align:center;'>Score</th></tr>";
			message.ccai.entitySentiment.entities.forEach((entity) => {
				entities += "<tr>";
				entities += (entity.metadata.wikipedia_url !== undefined ?
					`<td style='width:300px;'><a onclick='openWebpageInFrame(\"${entity.metadata.wikipedia_url}\")'><font color=blue>${entity.name} (${entity.metadata.wikipedia_url})</font></a></td>` :
					`<td style='width:300px;'><a onclick='openWikiFrame(\"${entity.name}\");'><font color=blue>${entity.name}</font></a></td>`);
				entities += `<td style='width:200px;'>${entity.type}</td>`;
				entities += `<td style='width:100px;text-align:center;'>${parseInt(parseFloat(entity.salience) * 100, 10)}</td>`;
				entities += `<td style='width:100px;text-align:center;'>${parseInt(parseFloat(entity.sentiment.magnitude) * 100, 10)}</td>`;
				entities += `<td style='width:100px;text-align:center;'>${parseInt(parseFloat(entity.sentiment.score) * 100, 10)}</td></tr>`;
			});
			entities += "</table>";
			$("#ccai").append(`<div style='padding:10px;font-size:17px;background-color:#eee;'>${entities}</div>`);
			$("#ccai").append("</div>");
			$("#ccai").append("<br/>");
		}

		if (message.ccai.faces && message.ccai.faces.length) {
			$("#ccai").append("<div style='margin-bottom:5px;font-size:15px;'><font style='color:blue;font-size:15p;font-weight:bold;'>● Detected Face Emotion (Vision API - Detect Face Emotion):</font></div>");
			var faces = "";
			message.ccai.faces.forEach((face) => {
				faces += "<table style='font-size:13px;background-color:#eee;width:100%;'>";
				faces += `<tr><td style='width:80px;'>Joy</td><td><i class='aoc-sentiment-happy' style='color:blue;'> ${face.joyLikelihood}</td></tr>` +
					`<tr><td style='width:80px;'>Sollow</td><td><i class='aoc-sentiment-sad' style='color:blue;'> ${face.sorrowLikelihood}</td></tr>` +
					`<tr><td style='width:80px;'>Anger</td><td><i class='aoc-sentiment-very-sad' style='color:blue;'> ${face.angerLikelihood}</td></tr>` +
					`<tr><td style='width:80px;'>Surprise</td><td><i class='aoc-sentiment-very-happy' style='color:blue;'> ${face.surpriseLikelihood}</td></tr>`;
				faces += "</table><br/>";
				imagePad_circle(face.landmarks[0].position.x, face.landmarks[0].position.y);
				imagePad_circle(face.landmarks[1].position.x, face.landmarks[1].position.y);
				/*
				imagePad_circle(face.landmarks[30].position.x, face.landmarks[30].position.y);
				imagePad_circle(face.landmarks[31].position.x, face.landmarks[31].position.y);
				*/
				imagePad_line(
					face.landmarks[2].position.x, face.landmarks[2].position.y,
					face.landmarks[3].position.x, face.landmarks[3].position.y);
				imagePad_line(
					face.landmarks[4].position.x, face.landmarks[4].position.y,
					face.landmarks[5].position.x, face.landmarks[5].position.y);
				imagePad_line(
					face.landmarks[10].position.x, face.landmarks[10].position.y,
					face.landmarks[12].position.x, face.landmarks[12].position.y);
				imagePad_line(
					face.landmarks[11].position.x, face.landmarks[11].position.y,
					face.landmarks[12].position.x, face.landmarks[12].position.y);
				imagePad_line(
					face.landmarks[13].position.x, face.landmarks[13].position.y,
					face.landmarks[15].position.x, face.landmarks[15].position.y);
				imagePad_line(
					face.landmarks[14].position.x, face.landmarks[14].position.y,
					face.landmarks[15].position.x, face.landmarks[15].position.y);

				imagePad_line(
					face.landmarks[30].position.x, face.landmarks[30].position.y,
					face.landmarks[31].position.x, face.landmarks[31].position.y);
			});
			$("#ccai").append(`<div style='padding:10px;font-size:17px;background-color:#eee;'>${faces}</div>`);
			$("#ccai").append("<br/>");
		}

		if (message.ccai.labels && message.ccai.labels.length) {
			$("#ccai").append("<div style='margin-bottom:5px;font-size:15px;'><font style='color:blue;font-size:15p;font-weight:bold;'>● Detected Labels (Vision API - Detect Objects):</font></div>");
			var labels = "<table style='font-size:13px;background-color:#eee;width:100%;'>";
			labels += "<tr><th style='width:300px;'>Label</th></tr>";
			message.ccai.labels.forEach((label) => {
				labels += `<tr><td><a onclick='openWikiFrame(\"${label.description}\");'><font color=blue>${label.description}</font></a></td></tr>`;
			});
			labels += "</table>";
			$("#ccai").append(`<div style='padding:10px;font-size:17px;background-color:#eee;'>${labels}</div>`);
			$("#ccai").append("<br/>");
		}

		if (message.ccai.logos && message.ccai.logos.length) {
			$("#ccai").append("<div style='margin-bottom:5px;font-size:15px;'><font style='color:blue;font-size:15p;font-weight:bold;'>● Detected Logo (Vision API - Detect Company/Organization):</font></div>");
			var logos = "<table style='font-size:13px;background-color:#eee;width:100%;'>";
			logos += "<tr><th style='width:300px;'>Logo</th></tr>";
			message.ccai.logos.forEach((logo) => {
				logos += `<tr><td><a onclick='openWikiFrame(\"${logo.description}\");'><font color=blue>${logo.description}</font></a></td></tr>`;
				imagePad_line(
					logo.boundingPoly.vertices[0].x, logo.boundingPoly.vertices[0].y,
					logo.boundingPoly.vertices[1].x, logo.boundingPoly.vertices[1].y);
				imagePad_line(
					logo.boundingPoly.vertices[1].x, logo.boundingPoly.vertices[1].y,
					logo.boundingPoly.vertices[2].x, logo.boundingPoly.vertices[2].y);
				imagePad_line(
					logo.boundingPoly.vertices[2].x, logo.boundingPoly.vertices[2].y,
					logo.boundingPoly.vertices[3].x, logo.boundingPoly.vertices[3].y);
				imagePad_line(
					logo.boundingPoly.vertices[3].x, logo.boundingPoly.vertices[3].y,
					logo.boundingPoly.vertices[0].x, logo.boundingPoly.vertices[0].y);
			});
			logos += "</table>";
			$("#ccai").append(`<div style='padding:10px;font-size:17px;background-color:#eee;'>${logos}</div>`);
			$("#ccai").append("<br/>");
		}

		if (message.ccai.landmarks && message.ccai.landmarks.length) {
			$("#ccai").append("<div style='margin-bottom:5px;font-size:15px;'><font style='color:blue;font-size:15p;font-weight:bold;'>● Detected Landmarks (Vision API - Detect Landmark Objects/Geographic Locations):</font> </div>");
			var landmarks = "<table style='font-size:13px;background-color:#eee;width:100%;'>";
			landmarks += "<tr><th style='width:300px;'>Landmark</th><th style='width:100px;'>Confidence</th></tr>";
			message.ccai.landmarks.forEach((landmark) => {
				landmarks += `<tr><td><a onclick='openWikiFrame(\"${landmark.description}\");'><font color=blue>${landmark.description}</font></a></td><td><font color=red>${parseInt(parseFloat(landmark.score) * 100, 10)}％</font></td></tr>`;
				imagePad_line(
					landmark.boundingPoly.vertices[0].x, landmark.boundingPoly.vertices[0].y,
					landmark.boundingPoly.vertices[1].x, landmark.boundingPoly.vertices[1].y);
				imagePad_line(
					landmark.boundingPoly.vertices[1].x, landmark.boundingPoly.vertices[1].y,
					landmark.boundingPoly.vertices[2].x, landmark.boundingPoly.vertices[2].y);
				imagePad_line(
					landmark.boundingPoly.vertices[2].x, landmark.boundingPoly.vertices[2].y,
					landmark.boundingPoly.vertices[3].x, landmark.boundingPoly.vertices[3].y);
				imagePad_line(
					landmark.boundingPoly.vertices[3].x, landmark.boundingPoly.vertices[3].y,
					landmark.boundingPoly.vertices[0].x, landmark.boundingPoly.vertices[0].y);
			});
			landmarks += "</table>";
			$("#ccai").append(`<div style='padding:10px;font-size:17px;background-color:#eee;'>${landmarks}</div>`);
			$("#ccai").append("<br/>");
		}

		if (message.ccai.recommends) {
			$("#recommends").show();
			$("#recommends").empty().append(message.ccai.recommends);
		}
	});

})(window, jQuery);

