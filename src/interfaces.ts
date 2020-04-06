export interface ValidatorConfig {
  identifier: string;
  method?: (fieldValue: unknown) => boolean;
  initableMethod?: (...params: unknown[]) => (fieldValue: unknown) => boolean;
}

export interface Validator {
  type: string;
  validate: (fieldValue: unknown) => boolean;
  isInitable: () => boolean;
  init?: (...params: unknown[]) => void;
}
