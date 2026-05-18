export interface AskQuestionResponse {
    answer: string;
    sources: string[];
    response_time_seconds: number;
    citation_count: number;
    citation_accuracy: number;
    domain: string;
    domain_label: string;
    domain_confidence: number;
  }
  
  export interface ConversationResponse {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    message_count?: number;
  }