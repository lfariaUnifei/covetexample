import { VetCase } from './entities/vet-case';

export interface VetCaseRepository {
  ofId(caseId: string): Promise<VetCase | undefined>;
  save(vetCase: VetCase): Promise<void>;
}
