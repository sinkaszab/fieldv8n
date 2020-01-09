import "core-js/stable";
import "regenerator-runtime/runtime";
import { asyncCompose } from "./functionalHelper";
import { InvalidData, ValidatorNameExists, TypeExists } from "./exceptions";
import { Validator, InitableValidator, SetInitalValue } from "./validators";

const validators = {};

const validateWith = validator => async prevValidator => {
  const { value, type, validate } = validator(prevValidator.value);

  if (prevValidator.history.includes(type)) {
    return prevValidator;
  }

  const valid = await validate();

  if (!valid) {
    const InvalidatedValidator = {
      value,
      type,
      error: new InvalidData(
        `Value "${String(value)}" for ${type} is invalid.`,
      ),
      history: [...prevValidator.history, prevValidator.type],
    };

    throw InvalidatedValidator;
  }

  return {
    value,
    type,
    history: [...prevValidator.history, prevValidator.type],
  };
};

function append(target, newValidator) {
  target.validate = asyncCompose(
    validateWith(newValidator),
    target.validate || SetInitalValue,
  );
}

const make = () => ({
  compose() {
    const fork = { ...this };
    const handlers = {
      get(target, key, context) {
        const newValidator = validators[key];

        if (newValidator) {
          if (newValidator.initable) {
            return initVal => {
              const initableNewValidator = newValidator(initVal);
              append(target, initableNewValidator);
              return context;
            };
          }
          append(target, newValidator);
          return context;
        }
        return Reflect.get(target, key, context);
      },
    };
    return new Proxy(fork, handlers);
  },
});

const types = validatorStore =>
  new Set(Object.values(validatorStore).map(({ type }) => type));

const alreadyExists = x => `${x} already exists.`;

function registerValidator({ name, type, method, initable }) {
  if (validators[name]) {
    throw new ValidatorNameExists(alreadyExists(`Validator: "${name}"`));
  }

  if (types(validators).has(type)) {
    throw new TypeExists(alreadyExists(`Type: "${type}"`));
  }

  const validator = initable
    ? InitableValidator({ type, method })
    : Validator({ type, method });
  validator.initable = !!initable;
  validator.type = type;
  validators[name] = validator;
}

export { make, registerValidator };
