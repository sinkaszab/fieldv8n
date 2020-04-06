import { ValidatorConfig } from "./interfaces";

const identifierMatchesStyle = ({ identifier }: ValidatorConfig): boolean =>
  /^([A-Z]+[A-Z_]*[A-Z]|[A-Z]+)$/.test(identifier);

const isFunction = (f: unknown): boolean => typeof f === "function";

export { identifierMatchesStyle, isFunction };
