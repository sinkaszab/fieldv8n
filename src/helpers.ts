const identifierMatchesStyle: (config: { identifier: string }) => boolean = ({
  identifier,
}) => /^([A-Z]+[A-Z_]*[A-Z]|[A-Z]+)$/.test(identifier);

const isFunction = (f: unknown): boolean => typeof f === "function";

export { identifierMatchesStyle, isFunction };
