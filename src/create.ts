import {
  FinalValidatorTypes,
  Validation,
  ValidateOptions,
  EventCallback,
  ValidationFactory,
} from "./interfaces";
import { VALIDATE, ValidationState } from "./shared";
import { CalledValidateOnInitable } from "./exceptions";

type ValidatorEntry = [string, FinalValidatorTypes];

const toEntries: (vs: FinalValidatorTypes[]) => ValidatorEntry[] = (vs) =>
  Object.entries(vs);

const initValidations = (validators: FinalValidatorTypes[]): Validation[] =>
  validators.map(({ type }) => ({ type, state: ValidationState.Pending }));

interface HandleChanged {
  validations: Validation[];
  done: boolean;
  onChange: EventCallback;
  onlyOnCompleted: boolean;
}

const handleChanged: (opts: HandleChanged) => void = ({
  validations,
  done,
  onChange,
  onlyOnCompleted,
}) => {
  if (onlyOnCompleted && !done) {
    return;
  }
  onChange(validations, done);
};

interface ValidationElements {
  prev: Validation[];
  current: Validation;
  next: Validation[];
}

interface ToNextValidations {
  elements: ValidationElements;
  nextState: ValidationState;
}

const toNextValidations: (params: ToNextValidations) => Validation[] = ({
  elements,
  nextState,
}) => [
  ...elements.prev,
  { ...elements.current, state: nextState },
  ...elements.next,
];

const validate: (opts: ValidateOptions) => Promise<void> = async ({
  validators,
  value,
  onChange,
  onlyOnCompleted,
}) => {
  const emit: (opts: { validations: Validation[]; done: boolean }) => void = ({
    validations,
    done,
  }) => {
    handleChanged({ validations, done, onChange, onlyOnCompleted });
  };
  let validations = initValidations(validators);
  emit({ validations, done: false });
  let rejected = false;
  let doEmit = (): void => {};
  for (const [i, validator] of toEntries(validators)) {
    const index = +i;
    const prev = validations.slice(0, index);
    const current = { ...validations[index] };
    const next = validations.slice(index + 1);
    const deferEmitInCycle = (nextState: ValidationState): void => {
      doEmit = (): void => {
        validations = toNextValidations({
          elements: { prev, current, next },
          nextState,
        });
        emit({
          validations,
          done: false,
        });
      };
    };
    if (rejected) {
      deferEmitInCycle(ValidationState.Canceled);
    } else {
      deferEmitInCycle(ValidationState.Validating);
      doEmit();
      try {
        const isValid = await validator.validate(value);
        if (isValid) {
          deferEmitInCycle(ValidationState.Accepted);
        } else {
          rejected = true;
          deferEmitInCycle(ValidationState.Rejected);
        }
      } catch (runtimeError) {
        // FIXME: inject runtimeError
        rejected = true;
        deferEmitInCycle(ValidationState.Rejected);
      }
    }
    doEmit();
  }
  // FIXME: Switch `done` to `true`.
  doEmit();
};

const create: (validators: FinalValidatorTypes[]) => ValidationFactory = (
  validators,
) => {
  let init;
  const isInitable = validators.some(
    (validator) => validator.isInitable && !validator.wasInited,
  );
  const types = validators.map(({ type }) => type);

  const validateHelper: (opts: {
    value: any;
    onChange: EventCallback;
    onlyOnCompleted?: boolean;
  }) => void = ({ value, onChange, onlyOnCompleted = false }) => {
    if (isInitable) {
      throw new CalledValidateOnInitable("Call init first, then validate.");
    }
    validate({ validators, value, onChange, onlyOnCompleted });
  };

  return Object.freeze({
    types,
    isInitable,
    [VALIDATE]: validateHelper,
    init,
  });
};

export default create;
