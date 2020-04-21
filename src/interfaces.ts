// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NonInitableMethod = (fieldValue: any) => boolean;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InitableMethod = (...params: any[]) => NonInitableMethod;

export interface ValidatorConfig {
  identifier: string;
  method: NonInitableMethod | InitableMethod;
  initable: boolean;
}

interface BaseValidator {
  type: string;
}

export interface FinalValidator extends BaseValidator {
  validate: NonInitableMethod;
  isInitable: false;
}

export interface InitedFinalValidator extends BaseValidator {
  validate: NonInitableMethod;
  isInitable: true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initParams: any[];
}

export interface InitableValidator extends BaseValidator {
  type: string;
  isInitable: true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  init: (...params: any[]) => InitedFinalValidator;
}

export type InitableOrFinalValidator = FinalValidator | InitableValidator;

export type FinalValidators = FinalValidator | InitedFinalValidator;
