// Imports the Google Cloud client library
const language = require('@google-cloud/language');

// Creates a client
const client = new language.LanguageServiceClient();

/**
 * TODO(developer): Uncomment the following line to run this code.
 */
// const text = 'Your text to analyze, e.g. Hello, world!';

// Prepares a document, representing the provided text
const document = {
  content: "As yet, no official policy statements on China have been released by the Biden transition team. Biden, though, is no foreign policy novice. During his almost five decades in national politics, Biden has repeatedly brushed up against China. As a senator, he played a role in China becoming a member of the World Trade Organization in 2001.",
  type: 'PLAIN_TEXT',
};

// Classifies text in the document
(async () => {
  const [classification] = await client.classifyText({document});
  console.log('Categories:');
  classification.categories.forEach((category) => {
    console.log(`Name: ${category.name}, Confidence: ${category.confidence}`);
  });
})();
