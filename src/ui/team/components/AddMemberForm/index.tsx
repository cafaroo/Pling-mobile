import { AddMemberFormContainer } from './AddMemberFormContainer';
import { AddMemberFormPresentation } from './AddMemberFormPresentation';

// Exportera container-komponenten som standard
export const AddMemberForm = AddMemberFormContainer;

// Exportera presentation separat för testbarhet och återanvändning
export { AddMemberFormPresentation }; 