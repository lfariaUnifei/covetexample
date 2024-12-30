import { VetCase } from './entities/vet-case';

export interface VetCaseRepository {
  ofId(caseId: string): Promise<VetCase>;
  save(vetCase: VetCase): Promise<void>;
}
