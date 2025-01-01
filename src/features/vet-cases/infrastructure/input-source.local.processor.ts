import {
  LocalFileContentLocation,
  VariableContentLocation,
} from '../../../domain';
import { InputSourceData } from '../domain/entities/storage-input-source';
import {
  InputSourceContent,
  InputSourceProcessor,
} from '../domain/input-source.service';

export class InputSourceLocalProcessor implements InputSourceProcessor {
  process(
    content: InputSourceContent,
  ): Promise<
    InputSourceData<LocalFileContentLocation | VariableContentLocation>
  > {
    throw new Error('Method not implemented.');
  }
}
