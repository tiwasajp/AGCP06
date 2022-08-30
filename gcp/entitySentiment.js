// Imports the Google Cloud client library
import language from '@google-cloud/language';

// Creates a client
const client = new language.LanguageServiceClient();

/**
 * TODO(developer): Uncomment the following line to run this code.
 */
//const text = "I am now in Lebanon and will no longer be held hostage by a rigged Japanese justice system where guilt is presumed, discrimination is rampant, and basic human rights are denied, in flagrant disregard of Japan's legal obligations under international law and treaties it is bound to uphold, he said in a statement, which was released on his behalf by a public relations firm.";

async function getEntitySentiment(text) {
  // Prepares a document, representing the provided text
  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };
  
  try {
    // Detects sentiment of entities in the document
    const [result] = await client.analyzeEntitySentiment({document});
    const entities = result.entities;
  
    //console.log("Entities and sentiments:");
    //console.log(JSON.stringify(entities));
  
    entities.forEach(entity => {
      //console.log("  Name: ${" + entity.name + "}");
      //console.log("  Type: ${" + entity.type + "}");
      //console.log("  Score: ${" + entity.sentiment.score + "}");
      //console.log("  Magnitude: ${" + entity.sentiment.magnitude + "}");
    });
  
    return result.entities;  
  }
  catch (e) {
    return [];
  }
}

const entitySentiment = function() {
  ;
}

entitySentiment.prototype.getEntitySentiment = async function(text) {
  return await getEntitySentiment(text);
}

export default entitySentiment;