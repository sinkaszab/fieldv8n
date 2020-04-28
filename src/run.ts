import { ValidationFactory, EventCallback } from "./types";
import { VALIDATE } from "./shared";

interface ValidationRunner {
  (options: {
    validation: ValidationFactory;
    value: any;
    onChange: EventCallback;
    onlyOnCompleted?: boolean;
  }): void;
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
