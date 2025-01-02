export type StoredContentLocation = {
  status: 'stored';
  contentId: string;
  contentType: string;
  storage: StorageMechanism;
};
export type TransientContentLocation = {
  status: 'transient';
  contentId: string;
  contentType: string;
  value: Buffer;
};

export type FileStorageMechanism = {
  name: 'File';
  path: string;
};
export type CloudStorageMechanism = {
  name: 'Cloud';
  cloudProvider: string;
  path: string;
};
export type StorageMechanism = FileStorageMechanism | CloudStorageMechanism;

export type ContentLocation = StoredContentLocation | TransientContentLocation;
