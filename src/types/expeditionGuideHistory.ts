import type { ExpeditionGuideInput, ExpeditionGuideOutput } from './expeditionGuide';

export interface ExpeditionGuideHistoryPayload {
  input: ExpeditionGuideInput;
  output: ExpeditionGuideOutput;
}
export interface ExpeditionGuideHistory extends ExpeditionGuideHistoryPayload {
  id: string;
  createdAt: string;
  updatedAt: string;
}
