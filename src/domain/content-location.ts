export type StoredContentLocation = {
  status: 'stored';
  contentId: string;
  contentType: string;
  cloudProvider: string;
  path: string;
};
export type TransientContentLocation = {
  status: 'transient';
  contentId: string;
  contentType: string;
  value: Buffer;
};

export type ContentLocation = StoredContentLocation | TransientContentLocation;
