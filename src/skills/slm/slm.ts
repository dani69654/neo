import type { Text2TextGenerationPipeline } from '@xenova/transformers';
import { loadJson, saveJson } from '../../core/modelStore';
import { skillResult, type SkillResult } from '../../core/skillResult';
import { DEFAULT_SLM_MODEL, MAX_NEW_TOKENS, TEMPERATURE, TOP_K } from './slmTestdata';

interface SlmConfig {
  model: string;
}

let generator: Text2TextGenerationPipeline | null = null;
let loadedModel = DEFAULT_SLM_MODEL;
let loadingPromise: Promise<void> | null = null;
let transformersModule: typeof import('@xenova/transformers') | null = null;
const dynamicImport = new Function('modulePath', 'return import(modulePath);') as (
  modulePath: string,
) => Promise<typeof import('@xenova/transformers')>;

async function getTransformers(): Promise<typeof import('@xenova/transformers')> {
  if (!transformersModule) {
    transformersModule = await dynamicImport('@xenova/transformers');
  }
  return transformersModule;
}

function cleanGeneratedText(generated: string): string {
  return generated
    .replace(/\s+/g, ' ')
    .replace(/^Answer:\s*/i, '')
    .trim();
}

function buildInstruction(prompt: string): string {
  return [
    'You are Neo, a concise and friendly AI assistant.',
    'Answer in plain English in 1-2 short sentences.',
    'Avoid repetition, lists, and filler text.',
    `Question: ${prompt}`,
    'Answer:',
  ].join('\n');
}

async function ensureGenerator(model: string = DEFAULT_SLM_MODEL): Promise<void> {
  if (generator && loadedModel === model) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const { pipeline } = await getTransformers();
    generator = (await pipeline('text2text-generation', model)) as Text2TextGenerationPipeline;
    loadedModel = model;
  })();

  try {
    await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

function isLegacyDecoderOnlyModel(model: string): boolean {
  const name = model.toLowerCase();
  return name.includes('gpt2') || name.includes('distilgpt2');
}

export async function trainSlm(model: string = DEFAULT_SLM_MODEL): Promise<void> {
  await ensureGenerator(model);
}

export async function saveSlmModel(): Promise<void> {
  saveJson('slm', 'config.json', { model: loadedModel } satisfies SlmConfig);
}

export async function loadSlmModel(): Promise<boolean> {
  const config = loadJson<SlmConfig>('slm', 'config.json');
  if (!config?.model) return false;
  const model = config.model.trim();

  if (isLegacyDecoderOnlyModel(model)) return false;

  try {
    await ensureGenerator(model);
    return true;
  } catch {
    // Prevent startup crashes when cached model config is stale or incompatible.
    // Bootstrap will retrain with the current default model.
    return false;
  }
}

export const useSlm = async (prompt: string): Promise<SkillResult<string>> => {
  if (!generator) {
    throw new Error('Skill slm not trained yet. Run "train slm" first.');
  }

  const text = prompt.trim();
  if (!text) return skillResult('Please write something to generate a reply.', 1);
  const instruction = buildInstruction(text);

  const out = (await generator(instruction, {
    max_new_tokens: MAX_NEW_TOKENS,
    do_sample: false,
    temperature: TEMPERATURE,
    top_k: TOP_K,
    repetition_penalty: 1.3,
    no_repeat_ngram_size: 3,
    num_beams: 4,
    early_stopping: true,
  })) as Array<{ generated_text: string }>;

  const generated = out?.[0]?.generated_text ?? '';
  const reply = cleanGeneratedText(generated);
  return skillResult(reply.length > 0 ? reply : 'I could not generate a useful reply. Try another prompt.');
};
