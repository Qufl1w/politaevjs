import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';

if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
  setGlobalDispatcher(new EnvHttpProxyAgent());
}



export async function getEmbedding(
  text: string,
  type: 'document' | 'query'
): Promise<number[]> {
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        taskType: type === 'document' ? 'RETRIEVAL_DOCUMENT' : 'RETRIEVAL_QUERY',
        outputDimensionality: 768,
      }),
    }
  )
  if (!res.ok) {
    throw new Error(`Gemini embeddings error: ${res.status} ${await res.text()}`)
  }
  const data = await res.json()
  return data.embedding.values
}