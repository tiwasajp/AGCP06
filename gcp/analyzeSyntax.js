// Imports the Google Cloud client library
import language from '@google-cloud/language';

// Creates a client
const client = new language.LanguageServiceClient();

/**
 * TODO(developer): Uncomment the following line to run this code.
 */
  
async function analyzeSyntaxText(text) {
  // Prepares a document, representing the provided text
  const document = {
      content: text,
      type: 'PLAIN_TEXT',
  };
  
  try {
    // Detects syntax in the document
    const [syntax] = await client.analyzeSyntax({document});

    //console.log('Tokens:');
    console.log(JSON.stringify(syntax));
  
    syntax.tokens.forEach(part => {
    //console.log("context:" + (part.partOfSpeech.tag === "NOUN" ? "[" + part.text.content + "]" : (part.partOfSpeech.tag === "VERB" ? "<" + part.text.content + ">" : part.text.content)) + " tag:" + part.partOfSpeech.tag + " case:" + part.partOfSpeech.case);
    });
  
    return syntax;
  }
  catch (e) {
    return null;
  }
  
}

const analyzeSyntax = function() {
  ;
}

analyzeSyntax.prototype.analyzeSyntaxText = async function(text) {
  return await analyzeSyntaxText(text);
}

export default analyzeSyntax;