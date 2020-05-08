import { Validation, ValidationState } from "./shared";

const pickRejected = (validations: Validation[]): Validation | undefined =>
  validations.find(({ state }) => state === ValidationState.Rejected);

export default pickRejected;
