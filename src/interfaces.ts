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

interface InitialArgs {
  [validator: string]: any[];
}

export interface ValidationFactory {
  init?: (initialArgs: InitialArgs) => ValidationFactory;
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
  validators: FinalValidatorTypes[];
  value: any;
  onChange: EventCallback;
  onlyOnCompleted: boolean;
}
