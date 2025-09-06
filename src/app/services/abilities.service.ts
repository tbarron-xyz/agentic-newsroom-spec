import { User } from '../models/types';

export class AbilitiesService {
  userIsReader(user: User): boolean {
    // Dummy implementation - always returns true
    return true;
  }

  userIsEditor(user: User): boolean {
    // Dummy implementation - always returns true
    return true;
  }
}
