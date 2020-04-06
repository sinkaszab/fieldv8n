import { ValidatorConfig, Validator } from "./interfaces";
import { InvalidIdentifierStyle, NoMethodDefined } from "./exceptions";
import { identifierMatchesStyle, isFunction } from "./helpers";

const validator: (config: ValidatorConfig) => () => Validator = (config) => {
  const isInitable = isFunction(config.initableMethod);

  if (!identifierMatchesStyle(config)) {
    throw new InvalidIdentifierStyle();
  }

  if (!isFunction(config.method) && !isInitable) {
    throw new NoMethodDefined();
  }

  return function factory(): Validator {
    let initedMethod: (v: unknown) => boolean;

    function init(...params: unknown[]): void {
      initedMethod = config.initableMethod(...params);
    }

    const validatorInstance: Validator = {
      type: config.identifier,
      validate: (inputValue) =>
        initedMethod ? initedMethod(inputValue) : config.method(inputValue),
      isInitable: () => isInitable,
    };

    if (validatorInstance.isInitable()) {
      validatorInstance.init = init;
    }

    return Object.freeze(validatorInstance);
  };
};

export default validator;
