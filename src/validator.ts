import {
  InitableMethod,
  NonInitableMethod,
  ValidatorConfig,
  FinalValidator,
  InitableValidator,
  InitedFinalValidator,
  InitableOrFinalValidator,
} from "./interfaces";
import { InvalidIdentifierStyle, MethodNeedsToBeAFunction } from "./exceptions";
import { identifierMatchesStyle, isFunction } from "./helpers";

const validator: (config: ValidatorConfig) => InitableOrFinalValidator = (
  config,
) => {
  if (!identifierMatchesStyle(config)) {
    throw new InvalidIdentifierStyle();
  }

  if (!isFunction(config.method)) {
    throw new MethodNeedsToBeAFunction();
  }

  function initValidator(...params: unknown[]): InitedFinalValidator {
    const method = config.method as InitableMethod;
    const final: InitedFinalValidator = {
      type: config.identifier,
      validate: method(...params) as NonInitableMethod,
      isInitable: true,
      wasInited: true,
      initParams: params,
    };
    return Object.freeze(final);
  }

  if (config.initable) {
    const initable: InitableValidator = {
      type: config.identifier,
      isInitable: true,
      wasInited: false,
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

export default validator;
