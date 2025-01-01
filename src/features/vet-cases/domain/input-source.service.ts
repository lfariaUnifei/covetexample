import {
  ContentLocation,
  LocalFileContentLocation,
  VariableContentLocation,
} from '../../../domain';
import {
  InputSourceName,
  TranscribedInputSource,
  TranscribingInputSource,
} from './entities/case-input';
import {
  InputSourceData,
  StoredInputSource,
} from './entities/storage-input-source';

export interface InputSourceProcessor {
  process(
    content: InputSourceContent,
  ): Promise<
    InputSourceData<LocalFileContentLocation | VariableContentLocation>
  >;
}
export type InputSourceContent = {
  name: InputSourceName;
  content: ContentLocation;
};

export interface InputSourceTranscriber {
  transcribe(
    inputSource: TranscribingInputSource,
  ): Promise<TranscribedInputSource>;
}

export interface InputSourceStorage {
  upload(toUpload: StoredInputSource): Promise<StoredInputSource>;
}
