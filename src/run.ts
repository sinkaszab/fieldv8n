import { ValidationFactory, EventCallback, VALIDATE } from "./shared";

export interface ValidationRunnerOptions {
  validation: ValidationFactory;
  value: any;
  onChange: EventCallback;
  onlyOnCompleted?: boolean;
}

interface ValidationRunner {
  (options: ValidationRunnerOptions): void;
}

const run: ValidationRunner = ({
  validation,
  value,
  onChange,
  onlyOnCompleted,
}) => {
  validation[VALIDATE]({ value, onChange, onlyOnCompleted });
};

export default run;
