/**
 * TODO(developer): Uncomment these variables before running the sample.
 */

// Imports the Google Cloud client library
//import speechTranscription from '@google-cloud/speech';
import speechTranscription from '@google-cloud/speech';

import fs from 'fs';

async function transcription_gs(fileName, languageCode) {
	// Creates a client
	const client = new speechTranscription.SpeechClient();

	// The audio file's encoding, sample rate in hertz, and BCP-47 language code
	const audio = {
		uri: fileName,
	};
	const config = {
		encoding: 'LINEAR16',
		sampleRateHertz: 8000,
		languageCode: languageCode, //'ja-JP'
		//languageCode: 'en_US',
		enableWordConfidence: true,
		enableAutomaticPunctuation: true,
	};
	const request = {
		audio: audio,
		config: config,
		model: 'phone_call',
	};

	// Detects speech in the audio file
	const [response] = await client.recognize(request)

	//console.log(response);

	const transcription = response.results
		.map(result => result.alternatives[0].transcript)
		.join('\n');

	let katakana = '';
	let confidence = '';
	response.results[0].alternatives[0].words.forEach((word) => {
		katakana += `${word.word.split('|')[1]} `;
		katakana = katakana.replace(/undefined/g, '').replace(/,/g, '|').replace(/ +/g, ' ');
		confidence += `${word.word.split('|')[2]},`;
	});

	return { transcription: transcription, katakana: katakana, confidence: confidence };
}

async function transcription(fileName, languageCode) {
	// Creates a client
	const client = new speechTranscription.SpeechClient();


	// Reads a local audio file and converts it to base64
	const file = fs.readFileSync(fileName);
	const audioBytes = file.toString('base64');

	// The audio file's encoding, sample rate in hertz, and BCP-47 language code
	const audio = {
		content: audioBytes,
	};
	const config = {
		encoding: 'LINEAR16',
		sampleRateHertz: 8000,
		languageCode: languageCode, //'ja-JP'
		//languageCode: 'en_US',
	};
	const request = {
		audio: audio,
		config: config,
		model: 'phone_call',
	};

	// Detects speech in the audio file
	const [response] = await client.recognize(request)

	console.log(response);

	const transcription = response.results
		.map(result => result.alternatives[0].transcript)
		.join('\n');

	console.log(response.results[0].alternatives);

	return transcription;
}


async function transcription_base64(audioBytes) {
	// Creates a client
	const client = new speechTranscription.SpeechClient();

	// The audio file's encoding, sample rate in hertz, and BCP-47 language code
	const audio = {
		content: audioBytes,
	};
	const config = {
		encoding: 'MULAW',
		sampleRateHertz: 8000,
		languageCode: languageCode,
		model: 'phone_call',
	};
	const request = {
		audio: audio,
		config: config,
	};

	// Detects speech in the audio file
	const [response] = await client.recognize(request);
	const transcription = response.results
		.map(result => result.alternatives[0].transcript)
		.join('\n');
	//console.log(`Transcription: ${transcription}`);

	return transcription;
}

const speech = function() {
	;
}

speech.prototype.transcription_gs = async function(fileName, languageCode) {
	return await transcription_gs(fileName, languageCode);
}

speech.prototype.transcription = async function(fileName, languageCode) {
	return await transcription(fileName, languageCode);
}

speech.prototype.transcription_base64 = async function(audioBytes, languageCode) {
	return await transcription_base64(audioBytes, languageCode);
}

export default speech;

