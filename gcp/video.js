/**
 * TODO(developer): Uncomment these variables before running the sample.
 */

const location = 'global';

//Imports the Google Cloud Video Intelligence library
import videoIntelligence from '@google-cloud/video-intelligence';

async function videoAnnotation(gcsUri) {
  //Creates a client
  const client = new videoIntelligence.VideoIntelligenceServiceClient();
  
  // The GCS uri of the video to analyze
  //const gcsUri = 'gs://context_bucket_4/VID_20200216_073126.mp4';

  // Construct request
  const request = {
    inputUri: gcsUri,
    features: ['LABEL_DETECTION'],
  };

  // Execute request
  const [operation] = await client.annotateVideo(request);

  console.log("Waiting for operation to complete... (this may take a few minutes)");

  const [operationResult] = await operation.promise();
  
  // Gets annotations for video
  const annotations = operationResult.annotationResults[0];

  // Gets labels for video from its annotations
  const labels = annotations.segmentLabelAnnotations;
  labels.forEach(label => {
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
      console.log(label.entity.description + " " + segment.startTimeOffset.seconds + "." + (segment.startTimeOffset.nanos / 1e6).toFixed(0) + "s - "+ segment.endTimeOffset.seconds + "." + (segment.endTimeOffset.nanos / 1e6).toFixed(0) + "s");
    });
  });
  
  console.log("Completed.");
  
  return annotations.segmentLabelAnnotations;
}

const video = function() {
  ;
}

video.prototype.annotateVideo = async function(gcsUri) {
  return await videoAnnotation(gcsUri);
}

export default video;
