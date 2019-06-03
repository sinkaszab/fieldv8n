const compose = (...fns) => x => fns.reduceRight((y, f) => f(y), x);

const Validator = ({ type, method, init }) => value => ({
  get type() {
    return type;
  },
  init(initVal) {
    this.validate = async () => await method(initVal)(value);
    return this;
  },
  validate: async () => await method(value)
});

const fieldv8n = (() => {
  const validators = {};

  return {
    registerValidator({ name, type, method, init }) {
      validators[name] = Validator({ type, method });
      return this;
    },
    compose() {
      const fork = { ...this };
      const handlers = {
        get(target, key, context) {
          const newValidator = validators[key];

          // FIXME: would be nice to drop a validation
          // registered earlier in a chain.
          // if (
          //   newValidator &&
          //   target.registeredTypes &&
          //   target.registeredTypes.has(newValidator.type)
          // ) {
          //   return context;
          // }

          if (newValidator) {
            // FIXME: Validators should be wrapped into Functors on compose.
            if (!target.validate) {
              target.validate = newValidator;
            } else {
              target.validate = compose(
                target.validate,
                newValidator
              );
            }

            // if (!target.registeredTypes) {
            //   target.registeredTypes = new Set([newValidator.type]);
            // } else {
            //   target.registeredTypes.add(newValidator);
            // }

            return context;
          }
          return Reflect.get(target, key, context);
        }
      };
      return new Proxy(fork, handlers);
    }
  };
})();

fieldv8n.registerValidator({
  name: "string",
  type: "IS_STRING",
  method: value => Object.prototype.toString.call(value) === "[object String]"
});

fieldv8n.registerValidator({
  name: "min",
  type: "MIN_LENGTH",
  method: init => value => value >= init.length,
  init: true
});

const chain1 = fieldv8n.compose().string.min;

console.log(chain1);

const chain2 = chain1.compose().string;

console.log(chain2);

console.log(chain2.validate("hello"));
