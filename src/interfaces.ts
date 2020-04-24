import { VALIDATE, ValidationState } from "./shared";

export type NonInitableMethod = (fieldValue: any) => boolean | Promise<boolean>;
export type InitableMethod = (...params: any[]) => NonInitableMethod;

export interface ValidatorConfig {
  identifier: string;
  method: NonInitableMethod | InitableMethod;
  initable: boolean;
}

interface Validator {
  type: string;
  isInitable: boolean;
  wasInited?: boolean;
}

export interface FinalValidator extends Validator {
  validate: NonInitableMethod;
}

export interface InitedFinalValidator extends Validator {
  validate: NonInitableMethod;
  initParams: any[];
}

export interface InitableValidator extends Validator {
  init: (...params: any[]) => InitedFinalValidator;
}

export type InitableOrFinalValidator = FinalValidator | InitableValidator;

export type FinalValidatorTypes = FinalValidator | InitedFinalValidator;

export type AnyValidator =
  | FinalValidator
  | InitedFinalValidator
  | InitableValidator;

type InitType = string;

export type InitValues = [InitType, any[]][];

export interface ValidationFactory {
  init?: (initialArgs: InitValues) => ValidationFactory;
  isInitable: boolean;
  [VALIDATE]: (opts: {
    value: any;
    onChange: EventCallback;
    onlyOnCompleted?: boolean;
  }) => void;
}

export interface Validation {
  type: string;
  state: ValidationState;
  runtimeError?: Error;
}

export type EventCallback = (validations: Validation[], done: boolean) => void;

export interface ValidateOptions {
  validators: AnyValidator[];
  value: any;
  onChange: EventCallback;
  onlyOnCompleted: boolean;
}

export type ValidatorEntry = [string, AnyValidator];

export interface HandleChanged {
  validations: Validation[];
  done: boolean;
  onChange: EventCallback;
  onlyOnCompleted: boolean;
}

interface ValidationElements {
  prev: Validation[];
  current: Validation;
  next: Validation[];
}

export interface IntoNextValidations {
  elements: ValidationElements;
  nextState: ValidationState;
}

export interface NextStateGenerator {
  validations: Validation[];
  index: number;
  nextState: ValidationState;
  runtimeError?: Error;
}
