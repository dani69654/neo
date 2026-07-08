/**
 * Default model and generation settings for the local SLM skill.
 * The model is downloaded on first `train slm`.
 */
export const DEFAULT_SLM_MODEL = 'Xenova/LaMini-Flan-T5-783M';

export const MAX_NEW_TOKENS = 96;
export const TEMPERATURE = 0.2;
export const TOP_K = 20;
