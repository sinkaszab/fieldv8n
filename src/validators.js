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

export { Validator, InitableValidator, SetInitalValue };
