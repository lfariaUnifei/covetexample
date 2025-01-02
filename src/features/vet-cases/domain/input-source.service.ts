import {
  TranscribedInputSource,
  TranscribingInputSource,
} from './entities/case-input';

export interface InputSourceTranscriber {
  transcribe(
    inputSource: TranscribingInputSource,
  ): Promise<TranscribedInputSource>;
}
