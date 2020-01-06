import "core-js/stable";
import "regenerator-runtime/runtime";

const asyncCompose = (...fns) => x =>
  fns.reduceRight(async (y, f) => f(await y), x);

const Validator = ({ type, method }) => value => ({
  get type() {
    return type;
  },
  get value() {
    return value;
  },
  validate: () => method(value),
});

const InitableValidator = ({ type, method }) => initVal => value => ({
  get type() {
    return type;
  },
  get value() {
    return value;
  },
  validate: () => method(initVal)(value),
});

const SetInitalValue = value => ({
  get type() {
    return "IS_VALUE";
  },
  get value() {
    return value;
  },
  get valid() {
    return true;
  },
  history: [],
});

class InvalidData extends Error {}

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

const validators = {};
const types = validatorStore =>
  new Set(Object.values(validatorStore).map(({ type }) => type));

const append = (target, newValidator) => {
  if (!target.validate) {
    // eslint-disable-next-line no-param-reassign
    target.validate = asyncCompose(validateWith(newValidator), SetInitalValue);
    return;
  }
  // eslint-disable-next-line no-param-reassign
  target.validate = asyncCompose(validateWith(newValidator), target.validate);
};

function registerValidator({ name, type, method, initable }) {
  if (validators[name]) {
    throw new Error(`Validator: "${name}" already exists.`);
  }

  if (types(validators).has(type)) {
    throw new Error(`Type: "${type} already exists."`);
  }

  const validator = initable
    ? InitableValidator({ type, method })
    : Validator({ type, method });
  validator.initable = !!initable;
  validators[name] = validator;
}

const fieldv8n = () => ({
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

export { fieldv8n, registerValidator, InvalidData };
