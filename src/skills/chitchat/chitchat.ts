/**
 * It replies to conversational topics (greetings, thanks, small talk, ...)
 * with a hand-written response. Unlike `double` or `isEven`, this skill is
 * rule-based rather than ML-based: a handful of canned replies is enough
 * for basic small talk, so there is no model to train.
 */

import { pickResponse, type ChitchatTopic } from './chitchatTestdata';

export const useChitchat = (topic: ChitchatTopic): string => {
  return pickResponse(topic);
};
