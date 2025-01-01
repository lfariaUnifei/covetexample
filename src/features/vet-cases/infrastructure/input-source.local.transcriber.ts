import { ContentLocationService } from '../../../domain';
import {
  TranscribedInputSource,
  TranscribingInputSource,
} from '../domain/entities/case-input';
import { InputSourceTranscriber } from '../domain/input-source.service';

export class InputSourceLocalTranscriber implements InputSourceTranscriber {
  async transcribe(
    inputSource: TranscribingInputSource,
    contentLocationService: ContentLocationService,
  ): Promise<TranscribedInputSource> {
    return {
      ...inputSource,
      status: 'transcribed',
      transcription: 'This is a transcription',
    };
  }
}
