export interface TopicResult {
  topic: string;
  content: string;
  uploadPath: string;
}

export interface TopicResponse extends Array<TopicResult> {}
