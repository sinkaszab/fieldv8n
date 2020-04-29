import { check, Outcome } from "./fieldv8n";
import { ValidationState } from "./shared";
import { OutComeTypeNotImplemented } from "./exceptions";

describe("Check identifies validations", () => {
  it("as accepted when all member was accepted.", () => {
    const v8nsPass = [
      { type: "A", state: ValidationState.Accepted },
      { type: "B", state: ValidationState.Accepted },
      { type: "C", state: ValidationState.Accepted },
    ];

    const v8nsFail = [
      { type: "A", state: ValidationState.Accepted },
      { type: "B", state: ValidationState.Accepted },
      { type: "C", state: ValidationState.Pending },
    ];

    expect(check(v8nsPass, Outcome.Accepted)).toBe(true);
    expect(check(v8nsFail, Outcome.Accepted)).toBe(false);
  });

  it("as rejected when one member was rejected.", () => {
    const v8nsPass = [
      { type: "A", state: ValidationState.Accepted },
      { type: "B", state: ValidationState.Rejected },
      { type: "C", state: ValidationState.Pending },
    ];

    const v8nsFail = [
      { type: "A", state: ValidationState.Accepted },
      { type: "B", state: ValidationState.Validating },
      { type: "C", state: ValidationState.Pending },
    ];

    expect(check(v8nsPass, Outcome.Rejected)).toBe(true);
    expect(check(v8nsFail, Outcome.Rejected)).toBe(false);
  });

  it("as runtime error when one member has a truthy runtimeError key.", () => {
    const v8nsPass = [
      { type: "A", state: ValidationState.Accepted },
      { type: "B", state: ValidationState.Rejected, runtimeError: Error() },
      { type: "C", state: ValidationState.Pending },
    ];

    const v8nsFail = [
      { type: "A", state: ValidationState.Accepted },
      { type: "B", state: ValidationState.Rejected },
      { type: "C", state: ValidationState.Canceled },
    ];

    expect(check(v8nsPass, Outcome.RuntimeError)).toBe(true);
    expect(check(v8nsFail, Outcome.RuntimeError)).toBe(false);
  });

  it("except for receiving unhandled outcome.", () => {
    const v8ns = [
      { type: "A", state: ValidationState.Accepted },
      { type: "B", state: ValidationState.Validating },
      { type: "C", state: ValidationState.Pending },
    ];

    expect(() => check(v8ns, "non_existing_outcome" as Outcome)).toThrow(
      OutComeTypeNotImplemented,
    );
  });
});
