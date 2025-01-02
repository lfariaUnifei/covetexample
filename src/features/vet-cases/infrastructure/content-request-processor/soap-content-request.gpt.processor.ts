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
    const prompt = `Generate SOAP veterinary notes for the following case: 
      ${input.transcription} with enpahisis on the following:
      ${request.instructions}
      return the response as an JSON containing: objective, subjective, assesment, plan
    `;
    const response = await this.chatGPT.getResponse(prompt);
    return {
      ...request,
      status: 'waiting_review',
      result: JSON.parse(response),
    };
  }
}
