import { ContentLocation } from '../../../../domain';
import { InputSourceName } from './case-input';

type _InputSourceData<
  T extends InputSourceName,
  R extends ContentLocation = ContentLocation,
> = {
  name: T;
  content: R;
};

export type AudioInputSourceData<T extends ContentLocation = ContentLocation> =
  _InputSourceData<'audio', T> & {
    format: string;
    encoding: string;
    sampleRateHertz: string;
  };
export type TextInputSourceData<T extends ContentLocation> = _InputSourceData<
  'text',
  T
>;

export type InputSourceData<T extends ContentLocation = ContentLocation> =
  | AudioInputSourceData<T>
  | TextInputSourceData<T>;

export type StoredInputSource = {
  id: string;
  caseId: string;
  data: InputSourceData;
};
