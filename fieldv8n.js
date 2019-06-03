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
      const handlers = {
        get(_, key, context) {
          if (validators[key]) {
            // TODO: Add validator to stack.
            console.log(key);
            return context;
          }
        }
      };
      return new Proxy(this, handlers);
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

console.log(fieldv8n.compose().string.min);
