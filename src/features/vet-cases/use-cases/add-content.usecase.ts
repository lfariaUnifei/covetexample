import { ContentTemplateName } from '../domain/entities/content-requests/content-request';
import { VetCaseRepository } from '../domain/vet-case.repository';

export class AddContentUsecase {
  constructor(private readonly caseRepository: VetCaseRepository) {}

  async execute({
    inputSourceId,
    caseId,
    contentId,
    templateName,
    instructions,
  }: AddContentUsecaseParams): Promise<void> {
    const vetCase = await this.caseRepository.ofId(caseId);
    if (!vetCase) {
      throw new Error('Case not found');
    }
    const input = vetCase.findInput(inputSourceId);
    if (!input) {
      throw new Error('Input not found');
    }
    if (vetCase.contentExists(contentId)) {
      return;
    }
    vetCase.addContentIfNotExists({
      contentId,
      customName: templateName,
      inputSource: input,
    });
    vetCase.addDefaultContentRequest({
      contentId,
      instructions,
      templateName,
    });
    await this.caseRepository.save(vetCase);
  }
}

export type AddContentUsecaseParams = {
  caseId: string;
  contentId: string;
  inputSourceId: string;
  instructions: string;
  templateName: ContentTemplateName;
};
