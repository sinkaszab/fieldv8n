const blockList = [/^compose$/i, /^register$/i];

const v8n = {
  validations: [],
  compose() {
    const fork = Object.create(this);
    return fork;
  },
  register(name) {
    const trimmedName = name.trim();
    if (blockList.find(pattern => pattern.test(trimmedName))) {
      throw new Error(`"${trimmedName}" is not allowed`);
    }
    // TODO: Register custom validation (globally).
    // Do we need a local register solution?!
    return this;
  }
};

const nameField = v8n.compose();

console.log(nameField);
