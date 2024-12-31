import { v4 } from 'uuid';
import { CaseInputSourceRef } from './case-input';
import { Content } from './content';
import { ContentRequest, ContentTemplateName } from './content-request';

export type VetCaseData = {
  ownerId: string;
  caseId: string;
  contents: Content[];
  inputs: CaseInputSourceRef[];

  name: string;

  createdAt: Date;
  updatedAt: Date;
};

export class VetCase {
  constructor(private readonly vetCase: VetCaseData) {}

  getCase(): VetCaseData {
    return {
      ...this.vetCase,
      contents: [...this.vetCase.contents],
      inputs: [...this.vetCase.inputs],
    };
  }

  addContentIfNotExists(content: Omit<Content, 'requests'>): void {
    if (this.contentExists(content.contentId)) {
      return;
    }
    this.vetCase.contents.push({ ...content, requests: [] });
  }

  addRequestToContent(contentId: string, request: ContentRequest): void {
    const content = this.findContent(contentId);
    const exists = this.findContentRequest({
      contentId,
      requestId: request.requestId,
    });
    if (!content || exists) {
      return;
    }
    content.requests.push(request);
  }

  addDefaultContentRequest(params: AddDefaultContentRequestParams): void {
    const content = this.findContent(params.contentId);
    if (!content) {
      throw new Error('Content not found');
    }
    if (content.requests.length > 0) {
      return;
    }
    content.requests.push({
      requestId: v4(),
      templateName: params.templateName,
      instructions: params.instructions,
      result: {
        status: 'processing',
      },
    });
  }

  updateContentRequest(
    contentId: string,
    updatedRequest: ContentRequest,
  ): void {
    const content = this.findContent(contentId);
    if (!content) {
      throw new Error('Content not found');
    }
    const requestIndex = content.requests.findIndex(
      (request) => request.requestId === updatedRequest.requestId,
    );
    if (requestIndex === -1) {
      throw new Error('Request not found');
    }
    content.requests[requestIndex] = updatedRequest;
  }

  findContentRequest(params: {
    contentId: string;
    requestId: string;
  }): ContentRequest | undefined {
    const content = this.findContent(params.contentId);
    if (!content) {
      return undefined;
    }
    const request = content.requests.find(
      (search) => search.requestId === params.requestId,
    );
    return request ? { ...request } : undefined;
  }

  contentExists(contentId: string): boolean {
    return Boolean(this.findContent(contentId));
  }

  findInput(inputId: string): CaseInputSourceRef | undefined {
    const result = this.findInputIndex(inputId);
    return result ? { ...this.vetCase.inputs[result] } : undefined;
  }

  setInputSourceAsTranscribed(inputId: string): void {
    const index = this.findInputIndex(inputId);
    if (index === undefined) {
      return;
    }
    this.vetCase.inputs[index].status = 'transcribed';
  }

  private findInputIndex(inputId: string): number | undefined {
    const index = this.vetCase.inputs.findIndex(
      (input) => input.id === inputId,
    );
    if (index === -1) {
      return undefined;
    }
    return index;
  }

  private findContent(contentId: string): Content | undefined {
    return this.vetCase.contents.find(
      (content) => content.contentId === contentId,
    );
  }
}

export type AddDefaultContentRequestParams = {
  contentId: string;
  instructions: string;
  templateName: ContentTemplateName;
};
