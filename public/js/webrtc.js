// Tomohiro Iwasa, Avaya Japan, 2017-2022
// Updated: 20220811

(async (window, $) => {
	'use strict';

	function WebRTC() {
		this.socket_emit = null;
		this.devices = [];
		this.deviceId = 0;
		this.local = null;
		this.remote = null;
		this.peerConnection = null;
	}

	WebRTC.prototype = {
		init: function(localMediaId, remoteMediaId) {
			this.socket_emit = window.socket_emit_webrtc;
			this.local = { media: document.querySelector(localMediaId), channel: null };
			this.remote = { media: document.querySelector(remoteMediaId), channel: null };
		},

		getPeerConnection: function() {
			return this.peerConnection;
		},

		cleanUpMedia: async function(client) {
			if (client.media) {
				client.media.pause();
				client.media.srcObject = null;
			}
		},

		playVideo: async function(id, client, stream) {
			try {
				console.log(`[playVideo] ${id} starting...`);
				client.channel = stream;
				client.media.srcObject = stream;
				await client.media.play();
				console.log(`[playVideo] ${id} started`);
			}
			catch (error) {
				console.log(`[playVideo] ${id} ${error}`);
			}
		},

		stopVideoTracks: async function(client) {
			try {
				await client.channel.getTracks().forEach((track) => {
					console.log(track);
					track.stop();
					client.channel = null;
				});
				console.log(`[stopVideoTracks] stopped`);
			}
			catch (error) {
				console.log(`[stopVideoTracks] ${error}`);
			}
		},

		getLocalDevices: async function() {
			return new Promise(async (resolve) => {
				const devices = (await navigator.mediaDevices.enumerateDevices())
					.filter((device) => device.kind === 'videoinput')
					.map((device) => {
						return {
							label: device.label,
							deviceId: device.deviceId,
						};
					});
				console.log(`[getLocalDevices] ${JSON.stringify(devices)}`);
				resolve(devices);
			});
		},

		getLocalStream: async function() {
			this.devices = await this.getLocalDevices();
			const constraints = {
				video: { deviceId: this.devices[this.deviceId].deviceId, width: { min: 960, ideal: 1920 }, height: { min: 640, ideal: 1080 } },
				audio: false,
			};
			console.log(`[getLocalStream] ${JSON.stringify(constraints)}`);
			await navigator.mediaDevices.getUserMedia(constraints).then(async (stream) => {
				console.log(`[startVideo] getUserMedia() → playVideo(local)`);
				await this.playVideo("local", this.local, stream);
			});
		},

		addIceCandidate: function(candidate) {
			if (this.peerConnection && this.peerConnection.remoteDescription) {
				this.peerConnection.addIceCandidate(candidate);
				console.log(`[addIceCandidate] this.peerConnection ${JSON.stringify(candidate)}`);
			}
		},

		sendAnswer: async function() {
			try {
				await this.peerConnection.createAnswer().then(async (answer) => {
					await this.peerConnection.setLocalDescription(answer);
					console.log(`[sendAnswer] setLocalDescription() → send SDP`);
					this.socket_emit({ sdp: this.peerConnection.localDescription });
				});
			}
			catch (error) {
				console.log(`[sendAnswer] ${error}`);
			}
		},

		receivedOffer: async function(sessionDescription) {
			try {
				await this.peerConnection.setRemoteDescription(sessionDescription).then(async () => {
					console.log(`[receivedOffer] setRemoteDescription(answer) → sendAnswer()`);
					await this.sendAnswer();
				});
			}
			catch (error) {
				console.log(`[receivedOffer] ${error}`);
			}
		},

		receivedAnswer: async function(sessionDescription) {
			try {
				console.log(`[receivedAnswer] peerConnection.iceConnectionState ${this.peerConnection.iceConnectionState}`);
				if (this.peerConnection.iceConnectionState === "checking") {
					console.log(`[receivedAnswer] setRemoteDescription(sessionDescription)`);
					await this.peerConnection.setRemoteDescription(sessionDescription);
				}
			}
			catch (error) {
				console.log(`[receivedAnswer] ${error}`);
			}
		},

		hangUp: async function() {
			if (this.peerConnection) {
				this.peerConnection = null;
				await this.stopVideoTracks(this.remote).then(this.cleanUpMedia(this.remote));
				await this.stopVideoTracks(this.local).then(this.cleanUpMedia(this.local));
				console.log(`[hangUp] this.peerConnection is closed`);
			}
			else {
				console.log(`[hangUp] this.peerConnection is already closed`);
			}
		},

		on: function(message) {
			if (!message.body.sdp) return;
			console.log(`[SDP] ${JSON.stringify(message.header)} ${JSON.stringify(message.body.sdp)}`);
			switch (message.body.sdp.type) {
				case "offer": {
					this.receivedOffer(message.body.sdp);
					break;
				}
				case "answer": {
					this.receivedAnswer(message.body.sdp);
					break;
				}
				case "candidate": {
					this.addIceCandidate(new RTCIceCandidate(message.body.sdp.ice));
					break;
				}
				case "close": {
					this.hangUp();
					break;
				}
				default: {
					break;
				}
			}
		},

		startVideo: async function(isOffer) {
			console.log(`[startVideo] offering ${isOffer}`);
			try {
				await this.getLocalStream().then(() => {
					this.peerConnection = new RTCPeerConnection({ "iceServers": [{ urls: "stun:stun.l.google.com:19302?transport=udp" }] });

					this.peerConnection.onicecandidate = (event) => {
						if (event.candidate) {
							console.log(`[SDP] send ice candidate`);
							this.socket_emit({ sdp: { type: 'candidate', ice: event.candidate } });
						}
						else {
							console.log(`[SDP] send this.peerConnection.localDescription`);
							this.socket_emit({ sdp: this.peerConnection.localDescription });
						}
					};

					this.peerConnection.onnegotiationneeded = async () => {
						try {
							if (isOffer) {
								console.log(`[ICE] peer.onnegotiationneeded → createOffer()`);
								this.peerConnection.createOffer({ iceRestart: false }).then(async (offer) => {
									this.peerConnection.setLocalDescription(offer);
									console.log(`[SDP] send localDescription`);
									this.socket_emit({ sdp: this.peerConnection.localDescription });
								});
							}
						}
						catch (error) {
							console.log(`[ICE] peer.onnegotiationneeded ${error}`);
						}
					};

					this.peerConnection.oniceconnectionstatechange = async () => {
						console.log(`[ICE] peer.oniceconnectionstatechange → ${this.peerConnection.iceConnectionState}`);
						switch (this.peerConnection.iceConnectionState) {
							case 'closed':
							case 'failed':
							case 'disconnected':
								this.hangUp();
								break;
						}
					};

					this.peerConnection.ontrack = async (event) => {
						console.log(`[ICE] peer.ontrack → playVideo(remote)`);
						await this.playVideo("remote", this.remote, event.streams[0]);
					};

					if (!this.local.channel) {
						console.log(`[startVideo] no local stream, but continue`);
						//return null;
					}
					else {
						console.log(`[startVideo] Adding tracks for local stream...`);
						this.local.channel.getTracks().forEach((track) => {
							console.log(track);
							this.peerConnection.addTrack(track, this.local.channel);
						});
					}
				});
			}
			catch (error) {
				console.log(`[startVideo] ${error}`);
			}
		},
	}

	window.WebRTC = WebRTC;

})(window, jQuery);