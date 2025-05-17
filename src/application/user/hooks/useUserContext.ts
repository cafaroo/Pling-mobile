import { createContext, useContext, createElement } from 'react';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { SupabaseUserRepository } from '@/infrastructure/supabase/repositories/UserRepository';
import { DomainEventPublisher } from '@/infrastructure/events/DomainEventPublisher';
import { supabase } from '@/infrastructure/supabase';

/**
 * Kontext för att hantera användar-relaterade beroenden
 */
interface UserContextType {
  userRepository: UserRepository;
  eventPublisher: IDomainEventPublisher;
}

/**
 * Skapa UserContext
 */
const UserContext = createContext<UserContextType | null>(null);

/**
 * Provider-props för UserContextProvider
 */
interface UserContextProviderProps {
  userRepository: UserRepository;
  eventPublisher: IDomainEventPublisher;
  children: React.ReactNode;
}

/**
 * Provider för användar-relaterade beroenden
 */
export function UserContextProvider({
  userRepository,
  eventPublisher,
  children,
}: UserContextProviderProps) {
  const value = {
    userRepository,
    eventPublisher,
  };

  return createElement(UserContext.Provider, { value }, children);
}

/**
 * Hook för att hämta beroenden till användar-relaterade funktioner
 */
export function useUserDependencies(): UserContextType {
  const context = useContext(UserContext);
  
  if (!context) {
    // Fallback till default implementationer om ingen provider finns
    // I produktion bör detta ersättas med en felmeddelande
    return {
      userRepository: new SupabaseUserRepository(supabase),
      eventPublisher: new DomainEventPublisher()
    };
  }
  
  return context;
}

/**
 * Hook för att hämta standardiserade användar-relaterade beroenden
 * Detta är en simplifierad version som direkt returnerar instanser
 * I en mer robust implementation skulle detta använda en factory eller DI-container
 */
export function useUserContext(): UserContextType {
  // Detta kan senare ersättas med Context-baserad implementation
  // För nu returnerar vi direkta instanser som fallback
  return {
    userRepository: new SupabaseUserRepository(supabase),
    eventPublisher: new DomainEventPublisher()
  };
} 