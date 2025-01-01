import { CaseInputSource } from './case-input';
import { ContentRequest } from './content-request';

export type Content = {
  contentId: string;
  customName: string;
  inputSource: CaseInputSource;
  requests: ContentRequest[];
};
