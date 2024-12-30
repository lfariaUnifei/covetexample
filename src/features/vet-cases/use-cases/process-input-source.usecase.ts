import {
  InputSourceProcessor,
  InputSourceRawContent,
  InputSourceTranscriber,
} from '../domain/input-source-service';
import { InputSourceRepository } from '../domain/input-source.repository';
import { VetCaseRepository } from '../domain/vet-case.repository';

export class ProcessInputSourceUsecase {
  constructor(
    private readonly caseRepository: VetCaseRepository,
    private readonly inputSourceRepository: InputSourceRepository,
    private readonly processor: InputSourceProcessor,
    private readonly transcriber: InputSourceTranscriber,
  ) {}

  async execute({
    caseId,
    inputSourceId,
    rawContent,
  }: ProcessInputSourceParams): Promise<void> {
    const vetCase = await this.caseRepository.ofId(caseId);
    if (!vetCase) {
      throw new Error('Case not found');
    }
    const input = vetCase.findInput(inputSourceId);
    if (!input || input.status !== 'transcribing') {
      return;
    }
    const processedData = await this.processor.process(rawContent);
    const uploaded = await this.inputSourceRepository.upload({
      inputSourceId,
      caseId,
      data: processedData,
    });
    const transcription = await this.transcriber.transcribe(uploaded);
    await this.inputSourceRepository.save(transcription);
    vetCase.setInputSourceAsTranscribed(inputSourceId);
    await this.caseRepository.save(vetCase);
  }
}

export type ProcessInputSourceParams = {
  caseId: string;
  inputSourceId: string;
  rawContent: InputSourceRawContent;
};
