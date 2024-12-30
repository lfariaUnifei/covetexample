export type ContentLocationName = 'local-file' | 'cloud-file' | 'variable';
type _ContentLocation<T extends ContentLocationName> = {
  name: T;
};
export type VariableContentLocation = _ContentLocation<'variable'> & {
  value: Buffer;
};
export type LocalFileContentLocation = _ContentLocation<'local-file'> & {
  path: string;
};
export type CloudFileContentLocation = _ContentLocation<'cloud-file'> & {
  cloudProvider: string;
  path: string;
};

export type ContentLocation =
  | VariableContentLocation
  | LocalFileContentLocation
  | CloudFileContentLocation;
