import { InputSourceTranscriber } from '../domain/input-source.service';
import { VetCaseRepository } from '../domain/vet-case.repository';

export class ProcessInputSourceUsecase {
  constructor(
    private readonly caseRepository: VetCaseRepository,
    private readonly transcriber: InputSourceTranscriber,
  ) {}

  async execute({
    caseId,
    inputSourceId,
  }: ProcessInputSourceParams): Promise<void> {
    const vetCase = await this.caseRepository.ofId(caseId);
    if (!vetCase) {
      throw new Error('Case not found');
    }
    const input = vetCase.findInput(inputSourceId);
    if (!input || input.status !== 'transcribing') {
      return;
    }
    const transcribed = await this.transcriber.transcribe(input);
    vetCase.updateInputSource(transcribed);
    await this.caseRepository.save(vetCase);
  }
}

export type ProcessInputSourceParams = {
  caseId: string;
  inputSourceId: string;
};
