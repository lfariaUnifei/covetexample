import { CaseInputSource } from './case-input';
import { Content } from './content';
import {
  ContentRequest,
  ContentTemplateName,
  ProcessedContentRequest,
} from './content-request';

type InternalVetCase = {
  ownerId: string;
  caseId: string;
  contents: Content[];
  inputs: CaseInputSource[];
  name: string;
};

export type VetCaseData = Readonly<
  Omit<InternalVetCase, 'contents' | 'inputs'>
> & {
  contents: readonly Content[];
  inputs: readonly CaseInputSource[];
};

export class VetCase {
  private readonly vetCase: InternalVetCase;
  constructor(vetCase: VetCaseData) {
    this.vetCase = vetCase as InternalVetCase;
  }

  toData(): VetCaseData {
    return this.vetCase;
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

  updateProcessedContentRequest(
    contentId: string,
    updatedRequest: ProcessedContentRequest,
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
    return content.requests.find(
      (search) => search.requestId === params.requestId,
    );
  }

  contentExists(contentId: string): boolean {
    return Boolean(this.findContent(contentId));
  }

  findInput(inputId: string): Readonly<CaseInputSource> {
    const result = this.findInputIndex(inputId);
    return { ...this.vetCase.inputs[result] };
  }

  updateInputSource(inputSource: CaseInputSource): void {
    const index = this.findInputIndex(inputSource.id);
    this.vetCase.inputs[index] = inputSource;
  }

  private findInputIndex(inputId: string): number {
    const index = this.vetCase.inputs.findIndex(
      (input) => input.id === inputId,
    );
    if (index === -1) {
      throw new Error('Input not found');
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
