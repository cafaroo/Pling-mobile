import { MemberCardContainer } from './MemberCardContainer';
import { MemberCardPresentation } from './MemberCardPresentation';

// Exportera container-komponenten som standard
export const MemberCard = MemberCardContainer;

// Exportera presentation separat för testbarhet och återanvändning
export { MemberCardPresentation }; 