import { ContentRequestProcessor } from '../domain/content-request.service';
import { VetCaseRepository } from '../domain/vet-case.repository';

export class ProcessContentRequestUsecase {
  constructor(
    private readonly caseRepository: VetCaseRepository,
    private readonly processor: ContentRequestProcessor,
  ) {}

  async execute({
    caseId,
    contentId,
    requestId,
  }: ProcessContentRequestParams): Promise<void> {
    const vetCase = await this.caseRepository.ofId(caseId);
    if (!vetCase) {
      throw new Error('Case not found');
    }
    const content = vetCase.findContentRequest({ contentId, requestId });
    if (!content) {
      throw new Error('Content not found');
    }
    if (content.result.status !== 'processing') {
      return;
    }
    const processed = await this.processor.process(content);
    if (processed.templateName !== content.templateName) {
      throw new Error('Generated an invalid processed content');
    }
    vetCase.updateProcessedContentRequest(contentId, processed);
    await this.caseRepository.save(vetCase);
  }
}

export type ProcessContentRequestParams = {
  caseId: string;
  contentId: string;
  requestId: string;
};
