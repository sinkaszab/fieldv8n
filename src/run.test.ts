import { validator, create, run } from "./fieldv8n";
import { prepare } from "./testUtils";
import { FinalValidatorTypes } from "./types";
import { CalledValidateOnInitable } from "./exceptions";

// MARK: `run` is just a thin layer over `create`, therefore
// tests are kept solid.

describe("Run", () => {
  const STARTS_FOO = validator({
    identifier: "STARTS_FOO",
    initable: false,
    method: (x: string) => x.startsWith("foo"),
  }) as FinalValidatorTypes;

  const CONTAINS_BAR = validator({
    identifier: "CONTAINS_BAR",
    initable: false,
    method: (x: string) => /bar/.test(x),
  }) as FinalValidatorTypes;

  const ENDS_BAZ = validator({
    identifier: "ENDS_BAZ",
    initable: false,
    method: (x: string) => x.endsWith("baz"),
  }) as FinalValidatorTypes;

  const CONTAINS = validator({
    identifier: "CONTAINS",
    initable: true,
    method: (a: string) => (b: string): boolean => new RegExp(a).test(b),
  }) as FinalValidatorTypes;

  it("validation only on completed.", async () => {
    const onChange = jest.fn();
    const { future, handler } = prepare(onChange);
    const v8n = create([STARTS_FOO, CONTAINS_BAR, ENDS_BAZ]);
    run({
      validation: v8n,
      value: "foobarbaz",
      onChange: handler,
      onlyOnCompleted: true,
    });

    await future;

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      [
        { type: "STARTS_FOO", state: "ACCEPTED" },
        { type: "CONTAINS_BAR", state: "ACCEPTED" },
        { type: "ENDS_BAZ", state: "ACCEPTED" },
      ],
      true,
    );
  });

  it("validation on each cycle.", async () => {
    const onChange = jest.fn();
    const { future, handler } = prepare(onChange);
    const v8n = create([STARTS_FOO, CONTAINS_BAR, ENDS_BAZ]);
    run({
      validation: v8n,
      value: "foobarbaz",
      onChange: handler,
      onlyOnCompleted: false,
    });

    await future;

    expect(onChange).toHaveBeenCalledTimes(8);
    expect(onChange).toHaveBeenNthCalledWith(
      1,
      [
        { type: "STARTS_FOO", state: "PENDING" },
        { type: "CONTAINS_BAR", state: "PENDING" },
        { type: "ENDS_BAZ", state: "PENDING" },
      ],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      2,
      [
        { type: "STARTS_FOO", state: "VALIDATING" },
        { type: "CONTAINS_BAR", state: "PENDING" },
        { type: "ENDS_BAZ", state: "PENDING" },
      ],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      3,
      [
        { type: "STARTS_FOO", state: "ACCEPTED" },
        { type: "CONTAINS_BAR", state: "PENDING" },
        { type: "ENDS_BAZ", state: "PENDING" },
      ],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      4,
      [
        { type: "STARTS_FOO", state: "ACCEPTED" },
        { type: "CONTAINS_BAR", state: "VALIDATING" },
        { type: "ENDS_BAZ", state: "PENDING" },
      ],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      5,
      [
        { type: "STARTS_FOO", state: "ACCEPTED" },
        { type: "CONTAINS_BAR", state: "ACCEPTED" },
        { type: "ENDS_BAZ", state: "PENDING" },
      ],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      6,
      [
        { type: "STARTS_FOO", state: "ACCEPTED" },
        { type: "CONTAINS_BAR", state: "ACCEPTED" },
        { type: "ENDS_BAZ", state: "VALIDATING" },
      ],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      7,
      [
        { type: "STARTS_FOO", state: "ACCEPTED" },
        { type: "CONTAINS_BAR", state: "ACCEPTED" },
        { type: "ENDS_BAZ", state: "ACCEPTED" },
      ],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      8,
      [
        { type: "STARTS_FOO", state: "ACCEPTED" },
        { type: "CONTAINS_BAR", state: "ACCEPTED" },
        { type: "ENDS_BAZ", state: "ACCEPTED" },
      ],
      true,
    );
  });

  it("", async () => {
    const v8n = create([CONTAINS, ENDS_BAZ]);

    expect(() =>
      run({
        validation: v8n,
        value: "foobarbaz",
        onChange: () => {},
        onlyOnCompleted: true,
      }),
    ).toThrow(CalledValidateOnInitable);
  });
});
