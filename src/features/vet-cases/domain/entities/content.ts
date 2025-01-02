import { ContentRequest } from './content-request';

export type Content = {
  contentId: string;
  customName: string;
  requests: ContentRequest[];
};
