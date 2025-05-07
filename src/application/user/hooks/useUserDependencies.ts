import { useMemo } from 'react';
import { UserRepository } from '../repositories/UserRepository';

export const useUserDependencies = () => {
  return useMemo(() => ({
    userRepository: new UserRepository(),
  }), []);
}; 