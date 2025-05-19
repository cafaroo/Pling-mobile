import React, { createContext, useContext, ReactNode } from 'react';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { UserService } from '@/domain/user/services/UserService';

/**
 * Kontext för att hantera användar-relaterade beroenden
 */
export interface UserContextType {
  userRepository: UserRepository;
  userService: UserService;
}

/**
 * Skapa UserContext
 */
const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * Provider-props för UserContextProvider
 */
interface UserContextProviderProps {
  children: ReactNode;
  userRepository: UserRepository;
  userService: UserService;
}

/**
 * Provider för user-kontexten
 * Ger tillgång till användarrepositoryt och service till alla underkomponenter
 */
export const UserContextProvider: React.FC<UserContextProviderProps> = ({
  children,
  userRepository,
  userService
}) => {
  return (
    <UserContext.Provider
      value={{
        userRepository,
        userService
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

/**
 * Hook för att använda user-kontexten
 * @returns UserContext med repository och service
 */
export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  
  if (!context) {
    throw new Error('useUserContext måste användas inom en UserContextProvider');
  }
  
  return context;
}; 