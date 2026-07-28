// local:src/types/master.ts

export interface Master {
  system: string;
  model: string;
  modelImg: string | null;
  apiKey: string | null;
  contextSize: number | null;   
  temperature: number | null;    
  repeatPenalty: number | null; 
  numPredict: number | null;    
  personality: string | null;
}

export interface ChatMessage {
  role: 'player' | 'master';
  text: string;
}