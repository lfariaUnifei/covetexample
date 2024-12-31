import { CaseInputSourceRef } from './case-input';
import { ContentRequest } from './content-request';

export type Content = {
  contentId: string;
  customName: string;
  inputSource: CaseInputSourceRef;
  requests: ContentRequest[];
};
