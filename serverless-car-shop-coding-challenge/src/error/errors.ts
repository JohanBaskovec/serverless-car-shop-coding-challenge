export class MissingRequestBody extends Error {
    constructor() {
        super('Missing body in HTTP request.');
        this.name = 'MissingRequestBody';
    }
}

export class MissingKeyInJSONBodyError extends Error {
    constructor(private readonly _missingKeys: string[]) {
        super(`Missing key in JSON: ${_missingKeys.join(',')}`);
        this.name = 'MissingKeyInJSONBodyError';
    }

    get missingKeys(): string[] {
        return this._missingKeys;
    }
}

export class MissingPathParametersError extends Error {
    constructor(private readonly _missingParameters: string[]) {
        super(`Missing path parameters: ${_missingParameters.join(',')}`);
        this.name = 'MissingPathParametersError';
    }

    get missingParameters(): string[] {
        return this._missingParameters;
    }
}

export class EntityDoesNotExistError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EntityDoesNotExistError';
    }
}

export class ConstraintError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConstraintError';
    }
}
