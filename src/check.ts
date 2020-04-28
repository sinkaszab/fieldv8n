import { Validation } from "./types";
import { ValidationState } from "./shared";
import { OutComeTypeNotImplemented } from "./exceptions";

export enum Outcome {
  Rejected = "rejected",
  Accepted = "accepted",
  RuntimeError = "runtime_error",
}

interface ResultCheck {
  (validations: Validation[], testAgainst: Outcome): boolean;
}

export const check: ResultCheck = (validations, testAgainst) => {
  switch (testAgainst) {
    case Outcome.Rejected: {
      return validations.some(
        ({ state }) => state === ValidationState.Rejected,
      );
    }
    case Outcome.RuntimeError: {
      return validations.some(({ runtimeError }) => runtimeError !== undefined);
    }
    case Outcome.Accepted: {
      return validations.every(
        ({ state }) => state === ValidationState.Accepted,
      );
    }
    default: {
      throw new OutComeTypeNotImplemented();
    }
  }
};
