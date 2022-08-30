/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
// const projectId = 'my-project';
// const location = 'global';
// const agentId = 'my-agent';
// const query = 'Hello';
// const languageCode = 'en'

const projectId = 'ccai-av-97a11ffc8857e5';
const location = 'asia-northeast1';
const apiEndpoint = `${location}-dialogflow.googleapis.com`;
const agentId = '7bd058ba-d1f0-4efb-b00a-d5f0a444eb7b';
const query = 'いわさ';
const languageCode = 'ja'

// Imports the Google Cloud Some API library
import {SessionsClient} from '@google-cloud/dialogflow-cx';
/**
 * Example for regional endpoint:
 *   const location = 'us-central1'
 *   const client = new SessionsClient({apiEndpoint: 'us-central1-dialogflow.googleapis.com'})
 */
const client = new SessionsClient({apiEndpoint: apiEndpoint});

async function detectIntentText() {
  const sessionId = Math.random().toString(36).substring(7);
  const sessionPath = client.projectLocationAgentSessionPath(
    projectId,
    location,
    agentId,
    sessionId
  );
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
      },
      languageCode,
    },
  };
  const [response] = await client.detectIntent(request);
  for (const message of response.queryResult.responseMessages) {
    if (message.text) {
      console.log(`Agent Response: ${message.text.text}`);
    }
  }
  if (response.queryResult.match.intent) {
    console.log(
      `Matched Intent: ${response.queryResult.match.intent.displayName}`
    );
  }
  console.log(
    `Current Page: ${response.queryResult.currentPage.displayName}`
  );
}

detectIntentText();

