import { ContentRequestProcessor } from '../../domain/content-request.service';
import { TranscribedInputSource } from '../../domain/entities/case-input';
import {
  ProcessedSoapContentRequest,
  SoapContentRequest,
} from '../../domain/entities/content-request';
import { ChatGptApi } from '../chat-gpt.api';

export class SoapContentRequestGPTProcessor implements ContentRequestProcessor {
  constructor(private readonly chatGPT: ChatGptApi) {}

  async process(
    request: SoapContentRequest,
    input: TranscribedInputSource,
  ): Promise<ProcessedSoapContentRequest> {
    const instructions = `If additional instructions are provided, include them as emphasis:
    "${request.instructions}"`;
    const prompt = `Generate a SOAP template for a veterinary case based on the following audio transcription:

"${input.transcription}"

${request.instructions.length > 0 ? instructions : ''}

Return your answer **strictly as a valid JSON object** that can be parsed by JSON.parse. The JSON must contain **exactly** these four properties as strings:

- subjective
- objective
- assessment
- plan

Do not include any additional text, explanations, or formatting. No markdown, no code fences, no extra keys.`;
    const response = await this.chatGPT.executePrompt(prompt);
    return {
      ...request,
      status: 'waiting_review',
      result: JSON.parse(response),
    };
  }
}
