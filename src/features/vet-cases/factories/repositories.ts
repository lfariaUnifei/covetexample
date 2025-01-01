import { VetCaseRepository } from '../domain/vet-case.repository';
import { VetCaseFirestoreRepository } from '../infrastructure/vet-case.firestore.repository';

export class VetCaseRepositoryFactory {
  static default(): VetCaseRepository {
    return new VetCaseFirestoreRepository();
  }
}
