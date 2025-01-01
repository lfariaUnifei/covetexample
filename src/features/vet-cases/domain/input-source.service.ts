import { ContentLocationService } from '../../../domain';
import {
  TranscribedInputSource,
  TranscribingInputSource,
} from './entities/case-input';

export interface InputSourceTranscriber {
  transcribe(
    inputSource: TranscribingInputSource,
    contentLocationService: ContentLocationService,
  ): Promise<TranscribedInputSource>;
}
