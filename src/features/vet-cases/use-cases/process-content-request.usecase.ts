import { ContentRequestProcessorFactory } from '../domain/content-request.service';
import { VetCaseRepository } from '../domain/vet-case.repository';

export class ProcessContentRequestUsecase {
  constructor(
    private readonly caseRepository: VetCaseRepository,
    private readonly processorFactory: ContentRequestProcessorFactory,
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
    const processor = await this.processorFactory.create(content);
    const processed = await processor.process();
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
