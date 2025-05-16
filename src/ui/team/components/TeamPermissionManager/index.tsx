import { TeamPermissionManagerContainer } from './TeamPermissionManagerContainer';
import { TeamPermissionManagerPresentation } from './TeamPermissionManagerPresentation';

// Exportera container-komponenten som standard
export const TeamPermissionManager = TeamPermissionManagerContainer;

// Exportera presentation separat för testbarhet och återanvändning
export { TeamPermissionManagerPresentation }; 