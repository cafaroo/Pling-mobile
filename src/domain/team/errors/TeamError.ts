export namespace TeamError {
  export class InvalidOwner extends Error {
    constructor() {
      super('Team måste ha en giltig ägare');
      this.name = 'InvalidOwner';
    }
  }

  export class InvalidRole extends Error {
    constructor(role: string) {
      super(`Ogiltig teamroll: ${role}`);
      this.name = 'InvalidRole';
    }
  }

  export class MemberAlreadyExists extends Error {
    constructor() {
      super('Användaren är redan medlem i teamet');
      this.name = 'MemberAlreadyExists';
    }
  }

  export class MemberNotFound extends Error {
    constructor() {
      super('Användaren är inte medlem i teamet');
      this.name = 'MemberNotFound';
    }
  }

  export class OnlyOneOwnerAllowed extends Error {
    constructor() {
      super('Team kan bara ha en ägare');
      this.name = 'OnlyOneOwnerAllowed';
    }
  }

  export class CannotRemoveOwner extends Error {
    constructor() {
      super('Kan inte ta bort teamets ägare');
      this.name = 'CannotRemoveOwner';
    }
  }

  export class CannotChangeOwnerRole extends Error {
    constructor() {
      super('Kan inte ändra ägarens roll');
      this.name = 'CannotChangeOwnerRole';
    }
  }

  export class NameTooShort extends Error {
    constructor() {
      super('Teamnamn måste vara minst 2 tecken');
      this.name = 'NameTooShort';
    }
  }

  export class NameTooLong extends Error {
    constructor() {
      super('Teamnamn får inte vara längre än 50 tecken');
      this.name = 'NameTooLong';
    }
  }

  export class DescriptionTooLong extends Error {
    constructor() {
      super('Beskrivning får inte vara längre än 500 tecken');
      this.name = 'DescriptionTooLong';
    }
  }
} 