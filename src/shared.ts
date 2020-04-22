const VALIDATE = Symbol("validate");

export enum ValidationState {
  Pending = "PENDING",
  Validating = "VALIDATING",
  Accepted = "ACCEPTED",
  Rejected = "REJECTED",
  Canceled = "CANCELED",
}

export { VALIDATE };
