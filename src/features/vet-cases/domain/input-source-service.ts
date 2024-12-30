import {
  LocalFileContentLocation,
  VariableContentLocation,
} from '../../../domain';
import {
  InputSourceData,
  InputSourceName,
  TranscribedInputSource,
  TranscribingInputSource,
} from './entities/case-input';

export interface InputSourceProcessor {
  process(
    rawContent: InputSourceRawContent,
  ): Promise<
    InputSourceData<LocalFileContentLocation | VariableContentLocation>
  >;
}
export interface InputSourceTranscriber {
  transcribe(
    inputSource: TranscribingInputSource,
  ): Promise<TranscribedInputSource>;
}

export type InputSourceRawContent = {
  name: InputSourceName;
  content: Buffer;
};
