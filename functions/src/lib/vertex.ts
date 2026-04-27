import { helpers, PredictionServiceClient } from '@google-cloud/aiplatform';

const PROJECT_ID = process.env.GCLOUD_PROJECT ?? process.env.GCP_PROJECT ?? '';
const LOCATION = process.env.VERTEX_LOCATION ?? 'us-central1';
const MODEL = 'text-embedding-004';
const ENDPOINT = `${LOCATION}-aiplatform.googleapis.com`;

let client: PredictionServiceClient | null = null;

function getClient(): PredictionServiceClient {
  if (!client) {
    client = new PredictionServiceClient({ apiEndpoint: ENDPOINT });
  }
  return client;
}

export async function embed(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('embed: text is empty');
  if (!PROJECT_ID) throw new Error('embed: GCLOUD_PROJECT not set');

  const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}`;
  const instances = [
    helpers.toValue({ content: trimmed, task_type: 'RETRIEVAL_DOCUMENT' }),
  ];

  const [response] = await getClient().predict({
    endpoint,
    instances: instances as never,
  });

  const prediction = response.predictions?.[0];
  if (!prediction) throw new Error('embed: empty prediction');

  const parsed = helpers.fromValue(prediction as never) as {
    embeddings?: { values?: number[] };
  };
  const values = parsed.embeddings?.values;
  if (!values || !Array.isArray(values)) {
    throw new Error('embed: malformed prediction response');
  }
  return values;
}
