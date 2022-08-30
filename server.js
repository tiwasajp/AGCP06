// Tomohiro Iwasa, Avaya Japan, 2017-2022
// Updated: 20220828

"use strict";

import fs from "fs";
import http from "http";
import express from "express";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import base64 from 'urlsafe-base64';

const ProjectID = "GCP-ProjectId";   // <-- GCP Project Id
import EntitySentiment from "./gcp/entitySentiment.js";
const entitySentiment = new EntitySentiment();
import AnalyzeSyntax from "./gcp/analyzeSyntax.js";
const analyzeSyntax = new AnalyzeSyntax();
import Translate from "./gcp/translate.js";
const translate = new Translate(ProjectID);
import DetectVision from "./gcp/detectVision.js";
const detectVision = new DetectVision();
//const Speech from "./gcp/speech.js");
//const speech = new Speech();
import Speech8k from "./gcp/speech8k.js";
const speech8k = new Speech8k();
import Video from "./gcp/video.js";
const video = new Video();
import Storage from "./gcp/storage.js";
const storage = new Storage("");

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

import { _stdout, _stdout_log, _stdout_table } from "./lib/stdout.js";
const INFO = true;
const DEBUG = true;

const PORT = 80;

const SERVER = process.env.SERVER || 'xxxx.xxxx.xxx';
const WORKDIR = process.env.WORKDIR || '/home/AGCP05';

const app = express();
app.use(express.static("public"));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("port", process.env.PORT || PORT);
app.set("view engine", "ejs");
app.set('trust proxy', true);

const io = new Server(http.createServer(app).listen(PORT,
	() => {
		console.log(`Server listening on port ${PORT}`);
	},
	{
		pingTimeout: 60000,
		pingInterval: 25000
	}
));

process.once("beforeExit", () => {
	if (INFO | DEBUG) _stdout("beforeExit");
});

// GKE health check
app.get('/', (req, resp) => {
	//if (DEBUG) _stdout(`/GKE health check`);
	return resp.sendStatus(200);
});

app.post("/postImageDataToFile", (req, resp) => {
	console.log(`/postImageDataToFile ${JSON.stringify(req.query)} body ${JSON.stringify(req.body)}`);
	try {
		const filePath = `${WORKDIR}/public/data/${req.query.file}`;
		var imageData = base64.decode(req.body.imageData.split(',')[1]);
		fs.writeFile(filePath, imageData, (error) => {
			if (error) throw error;
			resp.send({ result: "ok" }).end();
		});
	}
	catch (error) {
		_stdout(`error ${JSON.stringify(error)}`);
		resp.send({ result: error }).end();
	}
});

io.on("connection", (socket) => {
	socket.on("connect", () => {
		_stdout(`connect socket.id: ${socket.id} Number of clients: ${Array.from(io.sockets.adapter.rooms).length}`);
	});

	socket.on("disconnect", () => {
		_stdout(`disconnect socket.id: ${socket.id} Number of clients remained: ${Array.from(io.sockets.adapter.rooms).length}`);
	});

	socket.on('close', () => {
		_stdout(`closed socket.id: ${socket.id} Number of clients remained: ${Array.from(io.sockets.adapter.rooms).length}`);
	});

	socket.on("session", (message) => {
		_stdout(`[session] socket.id: ${socket.id} ${JSON.stringify(message)}`);
		if (message.action === "join") {
			socket.join(message.userId);
			io.sockets.emit("session", message);
			_stdout(`join userId: ${message.userId} Number of clients: ${Array.from(io.sockets.adapter.rooms).length}`);

			if (message.type === "customer" && message.mode === "card") {
				_stdout(`[session] startChatbotSenario(${JSON.stringify(message)}`);
				startChatbotSenario(message);
			}
		}
		else if (message.action === "leave") {
			_stdout(`leave userId: ${message.userId} Number of clients remained: ${Array.from(io.sockets.adapter.rooms).length}`);
			socket.leave(message.userId, () => {
				io.sockets.emit("session", message);
			});
		}
	});

	socket.on("data", async (message) => {
		console.table(message.header);
		_stdout(`message.body: ${JSON.stringify(message.body)}`);
		io.to(message.header.userId).emit("data", message);
		if (message.header.room) {
			io.to(message.header.room).emit("data", message);
		}
		message.ccai = { texts: null, dialogflow: null, suggest: null, syntax: null, entitySentiment: null, segmentLabelAnnotations: null, transcription: null, translations: null, recommends: null };
		if (message.body.media.type === "image" && message.body.media.file) {
			var filepath = `${WORKDIR}/public/data/${message.body.media.file}`;
			await detectVision.detectFulltext(filepath).then(async (texts) => {
				if (texts && texts.length) {
					message.ccai.texts = texts;
					await translate.translateText(message.ccai.texts[0].text, "ja", "en").then((translations) => { message.ccai.translations = translations; });
					await analyzeSyntax.analyzeSyntaxText(message.ccai.texts[0].text).then((syntax) => { message.ccai.syntax = syntax; });
					await entitySentiment.getEntitySentiment(message.ccai.texts[0].text).then((entities) => {
						message.ccai.entitySentiment = { entities: entities };
					});
				}
			});
			await detectVision.detectFaces(filepath).then((faces) => { message.ccai.faces = faces; });
			await detectVision.detectLabels(filepath).then((labels) => { message.ccai.labels = labels; });
			await detectVision.detectLogos(filepath).then((logos) => { message.ccai.logos = logos; });
			await detectVision.detectLandmarks(filepath).then((landmarks) => { message.ccai.landmarks = landmarks; });
			io.to(message.header.userId).emit("ccai", message);
		}
	});

	socket.on("webrtc", (message) => {
		console.table(message.header);
		_stdout(`message.body: ${JSON.stringify(message.body)}`);
		io.to(message.header.userId).emit("webrtc", message);
		if (message.header.room) {
			io.to(message.header.room).emit("webrtc", message);
		}
	});

	socket.on("event", (message) => {
		console.table(message);
		_stdout(`message.event: ${JSON.stringify(message.body)}`);
		io.sockets.emit("event", message);
	});
});
