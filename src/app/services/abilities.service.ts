import { User } from '../models/types';

export class AbilitiesService {
  userIsReader(user: User): boolean {
    return user.hasReader;
  }

  userIsReporter(user: User): boolean {
    return user.hasReporter;
  }

  userIsEditor(user: User): boolean {
    return user.hasEditor;
  }

  userIsAdmin(user: User): boolean {
    return user.hasEditor;
  }
}
