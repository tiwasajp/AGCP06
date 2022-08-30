/**
 * TODO(developer): Uncomment these variables before running the sample.
 */

// Imports the Google Cloud Translation library
import {TranslationServiceClient} from '@google-cloud/translate';

// Instantiates a client
const translationClient = new TranslationServiceClient();
async function translateText(projectId, text, sourceLanguageCode, targetLanguageCode) {
  // Construct request
  const location = 'global';
  const request = {
    parent: "projects/" + projectId + "/locations/" + location,
    contents: [text],
    mimeType: 'text/plain', // mime types: text/plain, text/html
    sourceLanguageCode: sourceLanguageCode,
    targetLanguageCode: targetLanguageCode
  };
  
  // Run request
  const [response] = await translationClient.translateText(request);

  for (const translation of response.translations) {
    //console.log("Translation:" + translation.translatedText);
  }

  return response.translations;
}

const translate = function(projectId) {
  this.projectId = projectId;
}

translate.prototype.translateText = async function(text, sourceLanguageCode, targetLanguageCode) {
  return await translateText(this.projectId, text, sourceLanguageCode, targetLanguageCode);
}

export default translate;
