import {
  Validation,
  ValidateOptions,
  EventCallback,
  ValidationFactory,
  ValidatorEntry,
  HandleChanged,
  IntoNextValidations,
  NextStateGenerator,
  InitableOrFinalValidator,
  FinalValidatorTypes,
  AnyValidator,
  InitValues,
  InitableValidator,
  InitedFinalValidator,
  FinalValidator,
} from "./types";
import { VALIDATE, ValidationState } from "./shared";
import {
  CalledValidateOnInitable,
  InitOrderTypeMismatch,
  MissingInit,
} from "./exceptions";

const toEntries: (vs: AnyValidator[]) => ValidatorEntry[] = (vs) =>
  Object.entries(vs);

const initValidations = (
  validators: InitableOrFinalValidator[],
): Validation[] =>
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
  emit({ validations, done: !validations.length });
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
        const isValid = await (validator as FinalValidatorTypes).validate(
          value,
        );
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

const isValidatorInitable = (validator: InitableOrFinalValidator): boolean =>
  validator.isInitable && !validator.wasInited;

const initValidators = (
  validators: AnyValidator[],
  create: (validators: InitableOrFinalValidator[]) => ValidationFactory,
) => (initVals: InitValues): ValidationFactory =>
  create(
    validators.map(
      (validator: AnyValidator): FinalValidatorTypes => {
        if (isValidatorInitable(validator)) {
          const currentVals = initVals.shift();
          if (currentVals === undefined) {
            throw new MissingInit();
          }
          const [type, vals] = currentVals;
          if (type !== validator.type) {
            throw new InitOrderTypeMismatch();
          }
          return (validator as InitableValidator).init(
            ...vals,
          ) as InitedFinalValidator;
        } else {
          return validator as FinalValidator;
        }
      },
    ),
  );

interface Creator {
  (validators: InitableOrFinalValidator[]): ValidationFactory;
}

interface ValidateHelper {
  (opts: {
    value: any;
    onChange: EventCallback;
    onlyOnCompleted?: boolean;
  }): void;
}

const create: Creator = (validators) => {
  const init = initValidators(validators, create);
  const isInitable = validators.some((validator) =>
    isValidatorInitable(validator),
  );
  const types = validators.map(({ type }) => type);

  const validateHelper: ValidateHelper = ({
    value,
    onChange,
    onlyOnCompleted = false,
  }) => {
    if (isInitable) {
      throw new CalledValidateOnInitable("Call init first, then validate.");
    }
    validate({ validators, value, onChange, onlyOnCompleted });
  };

  return Object.freeze({
    types,
    isInitable,
    [VALIDATE]: validateHelper,
    init(initVals: InitValues): ValidationFactory {
      if (isInitable) {
        return init(initVals);
      } else {
        return this;
      }
    },
  });
};

export default create;
