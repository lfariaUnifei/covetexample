import {
  TranscribedInputSource,
  TranscribingInputSource,
} from '../domain/entities/case-input';
import { InputSourceTranscriber } from '../domain/input-source.service';

export class InputSourceLocalTranscriber implements InputSourceTranscriber {
  transcribe(
    inputSource: TranscribingInputSource,
  ): Promise<TranscribedInputSource> {
    throw new Error('Method not implemented.');
  }
}
