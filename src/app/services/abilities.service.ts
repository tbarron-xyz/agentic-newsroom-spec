import { User } from '../models/types';

export class AbilitiesService {
  userIsReader(user: User): boolean {
    if (user.role === 'admin') return true;
    return user.hasReader;
  }

  userIsReporter(user: User): boolean {
    if (user.role === 'admin') return true;
    return user.hasReporter;
  }

  userIsEditor(user: User): boolean {
    if (user.role === 'admin') return true;
    return user.hasEditor;
  }

  userIsAdmin(user: User): boolean {
    return user.role === 'admin';
  }
}
