import { ProcessContentRequestUsecase } from '../use-cases/process-content-request.usecase';
import { ProcessInputSourceUsecase } from '../use-cases/process-input-source.usecase';
import { VetCaseRepositoryFactory } from './repositories';
import {
  ContentRequestProcessorFactoryAdapter,
  InputSourceProcessorFactory,
  InputSourceStorageFactory,
  InputSourceTranscriberFactory,
} from './services';

export class ProcessInputSourceUsecaseFactory {
  static default(): ProcessInputSourceUsecase {
    return new ProcessInputSourceUsecase(
      VetCaseRepositoryFactory.default(),
      InputSourceStorageFactory.default(),
      InputSourceProcessorFactory.default(),
      InputSourceTranscriberFactory.default(),
    );
  }
}

export class ProcessContentRequestUsecaseFactory {
  static default(): ProcessContentRequestUsecase {
    return new ProcessContentRequestUsecase(
      VetCaseRepositoryFactory.default(),
      new ContentRequestProcessorFactoryAdapter(),
    );
  }
}
