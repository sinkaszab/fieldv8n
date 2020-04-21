import {
  InitableMethod,
  NonInitableMethod,
  ValidatorConfig,
  Validator,
  FinalValidator,
  InitableValidator,
  InitedFinalValidator,
} from "./interfaces";
import { InvalidIdentifierStyle, MethodNeedsToBeAFunction } from "./exceptions";
import { identifierMatchesStyle, isFunction } from "./helpers";

const validator: (config: ValidatorConfig) => () => Validator = (config) => {
  if (!identifierMatchesStyle(config)) {
    throw new InvalidIdentifierStyle();
  }

  if (!isFunction(config.method)) {
    throw new MethodNeedsToBeAFunction();
  }

  return function factory(): Validator {
    function initValidator(...params: unknown[]): InitedFinalValidator {
      const method = config.method as InitableMethod;
      const final: InitedFinalValidator = {
        type: config.identifier,
        validate: method(...params) as NonInitableMethod,
        isInitable: true,
        initParams: params,
      };
      return Object.freeze(final);
    }

    if (config.initable) {
      const initable: InitableValidator = {
        type: config.identifier,
        isInitable: true,
        init: initValidator,
      };
      return Object.freeze(initable);
    } else {
      const final: FinalValidator = {
        type: config.identifier,
        validate: config.method as NonInitableMethod,
        isInitable: false,
      };
      return Object.freeze(final);
    }
  };
};

export default validator;
