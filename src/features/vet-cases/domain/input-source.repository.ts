import {
  CaseInputSource,
  InputSourceData,
  TranscribingInputSource,
} from './entities/case-input';

export interface InputSourceRepository {
  upload(toUpload: UploadInputSource): Promise<TranscribingInputSource>;
  save(inputSource: CaseInputSource): Promise<void>;
  ofId(inputSourceId: string): Promise<CaseInputSource>;
}

export type UploadInputSource = {
  caseId: string;
  inputSourceId: string;
  data: InputSourceData;
};
