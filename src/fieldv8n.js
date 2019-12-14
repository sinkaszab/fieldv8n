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

export class InvalidData extends Error {}

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

let globalSafeMode = null;
const validators = {};
const types = validatorStore =>
  new Set(validatorStore.values().map(({ type }) => type));

const append = (target, newValidator) => {
  if (!target.validate) {
    // eslint-disable-next-line no-param-reassign
    target.validate = asyncCompose(validateWith(newValidator), SetInitalValue);
    return;
  }
  // eslint-disable-next-line no-param-reassign
  target.validate = asyncCompose(validateWith(newValidator), target.validate);
};

const fieldv8n = ({ safeMode = false } = { safeMode: false }) => {
  if (globalSafeMode === null) {
    globalSafeMode = safeMode;
  }

  return {
    registerValidator({ name, type, method, initable }) {
      if (globalSafeMode && validators[name]) {
        throw new Error(
          `Validator: "${name}" already exists. You are in SafeMode.`,
        );
      }

      if (globalSafeMode && types(validators).has(type)) {
        throw new Error(`Type: "${type} already exists. You are in SafeMode."`);
      }

      const validator = initable
        ? InitableValidator({ type, method })
        : Validator({ type, method });
      validator.initable = initable;
      validators[name] = validator;
      return this;
    },

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
  };
};

export default fieldv8n;
