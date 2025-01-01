import { ContentLocation } from '../../../../domain';

export type InputSourceName = 'audio' | 'text';
export type InputSourceStatus = 'transcribing' | 'transcribed';

type _CaseInputSourceRef<T extends InputSourceStatus> = {
  id: string;
  name: InputSourceName;
  content: ContentLocation;
  status: T;
};

export type TranscribedInputSource = _CaseInputSourceRef<'transcribed'> & {
  transcription: string;
};
export type TranscribingInputSource = _CaseInputSourceRef<'transcribing'>;

export type CaseInputSource = TranscribedInputSource | TranscribingInputSource;
