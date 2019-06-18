const asyncCompose = (...fns) => x =>
  fns.reduceRight(async (y, f) => f(await y), x);

const Validator = ({ type, method }) => value => ({
  get type() {
    return type;
  },
  get value() {
    return value;
  },
  validate: () => method(value)
});

const InitableValidator = ({ type, method }) => initVal => value => ({
  get type() {
    return type;
  },
  get value() {
    return value;
  },
  validate: () => method(initVal)(value)
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
  history: []
});

const validateWith = validator => async prevValidator => {
  if (!prevValidator.valid) {
    return prevValidator;
  }

  const instance = validator(prevValidator.value);
  const { type, validate } = instance;

  if (prevValidator.history.includes(type)) {
    return prevValidator;
  }

  const valid = await instance.validate();
  instance.valid = valid;
  instance.history = [...prevValidator.history, prevValidator.type];
  return instance;
};

const validators = {};

const append = (target, newValidator) => {
  if (!target.validate) {
    target.validate = asyncCompose(validateWith(newValidator), SetInitalValue);
  } else {
    target.validate = asyncCompose(validateWith(newValidator), target.validate);
  }
};

const fieldv8n = (() => ({
  safeMode: false,
  registerValidator({ name, type, method, initable }) {
    if (this.safeMode && validators[name]) {
      throw new Error(
        `Validator: "${name}" already exists. No overwrite in SafeMode.`
      );
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
      }
    };
    return new Proxy(fork, handlers);
  }
}))();

fieldv8n
  .registerValidator({
    name: "string",
    type: "IS_STRING",
    method: value => Object.prototype.toString.call(value) === "[object String]"
  })
  .registerValidator({
    name: "min",
    type: "MIN_LENGTH",
    method: init => value => value.length >= init,
    initable: true
  });

const chain1 = fieldv8n.compose().string;
const chain2 = chain1.compose().min(5).string;

chain1
  .validate("hi")
  .then(({ value, valid, type, history }) =>
    console.log("result1", value, valid, type, history)
  );

chain2
  .validate("hi")
  .then(({ value, valid, type, history }) =>
    console.log("result2", value, valid, type, history)
  );

chain2
  .validate(new Promise(resolve => setTimeout(resolve("hello"), 3000)))
  .then(({ value, valid, type, history }) =>
    console.log("result3", value, valid, type, history)
  );
