import { ContentLocation, VariableContentLocation } from '../../../../domain';

export type InputSourceName = 'audio' | 'text';
export type InputSourceStatus = 'transcribing' | 'transcribed';
export type CaseInputSourceRef = {
  id: string;
  name: InputSourceName;
  status: InputSourceStatus;
};

type _InputSourceData<
  T extends InputSourceName,
  R extends ContentLocation = ContentLocation,
> = {
  name: T;
  content: R;
};

export type AudioInputSource<T extends ContentLocation = ContentLocation> =
  _InputSourceData<'audio', T> & {
    format: string;
    encoding: string;
    sampleRateHertz: string;
  };
export type TextInputSource<
  T extends ContentLocation = VariableContentLocation,
> = _InputSourceData<'text', T>;

export type InputSourceData<T extends ContentLocation = ContentLocation> =
  | AudioInputSource<T>
  | TextInputSource<T>;

export type _CaseInputSource<T extends InputSourceStatus> = {
  id: string;
  caseId: string;
  data: InputSourceData;
  status: T;
};

export type TranscribedInputSource = _CaseInputSource<'transcribed'> & {
  transcription: string;
};
export type TranscribingInputSource = _CaseInputSource<'transcribing'>;

export type CaseInputSource = TranscribedInputSource | TranscribingInputSource;
