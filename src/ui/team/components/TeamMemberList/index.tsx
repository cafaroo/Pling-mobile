import { TeamMemberListContainer } from './TeamMemberListContainer';
import { TeamMemberListPresentation } from './TeamMemberListPresentation';

// Exportera container-komponenten som standard
export const TeamMemberList = TeamMemberListContainer;

// Exportera presentation separat för testbarhet och återanvändning
export { TeamMemberListPresentation }; 