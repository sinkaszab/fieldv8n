import {
  FinalValidatorTypes,
  Validation,
  ValidateOptions,
  EventCallback,
  ValidationFactory,
  ValidatorEntry,
  HandleChanged,
  IntoNextValidations,
  NextStateGenerator,
} from "./interfaces";
import { VALIDATE, ValidationState } from "./shared";
import { CalledValidateOnInitable } from "./exceptions";

const toEntries: (vs: FinalValidatorTypes[]) => ValidatorEntry[] = (vs) =>
  Object.entries(vs);

const initValidations = (validators: FinalValidatorTypes[]): Validation[] =>
  validators.map(({ type }) => ({ type, state: ValidationState.Pending }));

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

const intoNextValidations: (params: IntoNextValidations) => Validation[] = ({
  elements,
  nextState,
}) => [
  ...elements.prev,
  { ...elements.current, state: nextState },
  ...elements.next,
];

const generateNextValidationsState: (
  opts: NextStateGenerator,
) => IntoNextValidations = ({
  validations,
  index,
  nextState,
  runtimeError,
}) => ({
  elements: {
    prev: validations.slice(0, index),
    current: { ...validations[index], ...(runtimeError && { runtimeError }) },
    next: validations.slice(index + 1),
  },
  nextState,
});

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let doEmit = (cycleDidEnd?: boolean): void => {};
  for (const [i, validator] of toEntries(validators)) {
    const deferEmitInCycle = (
      nextState: ValidationState,
      runtimeError?: Error,
    ): void => {
      doEmit = (cycleDidEnd = false): void => {
        validations = intoNextValidations(
          generateNextValidationsState({
            validations,
            index: +i,
            nextState,
            runtimeError,
          }),
        );
        emit({
          validations,
          done: cycleDidEnd,
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
        rejected = true;
        deferEmitInCycle(ValidationState.Rejected, runtimeError);
      }
    }
    doEmit();
  }
  const cycleDidEnd = true;
  doEmit(cycleDidEnd);
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
