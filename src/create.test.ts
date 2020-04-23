import { create, validator } from "./fieldv8n";
import { FinalValidatorTypes } from "./interfaces";
import { VALIDATE } from "./shared";
import { CalledValidateOnInitable } from "./exceptions";

describe("Create validation", () => {
  const IS_FOO = validator({
    identifier: "IS_FOO",
    initable: false,
    method: (x: string) => x === "foo",
  }) as FinalValidatorTypes;

  const IS_BAR = validator({
    identifier: "IS_BAR",
    initable: false,
    method: (x: string) => x === "bar",
  }) as FinalValidatorTypes;

  const IS_BAZ = validator({
    identifier: "IS_BAZ",
    initable: false,
    method: (x: string) => x === "baz",
  }) as FinalValidatorTypes;

  const CONTAINS = validator({
    identifier: "CONTAINS",
    initable: true,
    method: (a: string) => (b: string): boolean => b === a,
  }) as FinalValidatorTypes;

  const IS_BOMB = validator({
    identifier: "IS_BOMB",
    initable: false,
    method: (x: string) => {
      if (x === "foo") {
        throw new Error();
      }
      return x === "boom!";
    },
  }) as FinalValidatorTypes;

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

  const prepare: (cb: any) => { future: Promise<void>; handler: () => void } = (
    jestCallback: any,
  ) => {
    let releaseLockWhenAllValidationsFinished: any;
    const handler = (...args: any[]): void => {
      const [, done] = args;
      jestCallback(...args);
      if (done) {
        releaseLockWhenAllValidationsFinished();
      }
    };
    const future: Promise<void> = new Promise((resolve) => {
      releaseLockWhenAllValidationsFinished = resolve;
    });
    return { future, handler };
  };

  it("only calls onChange on completed when passed validators are an empty array.", async () => {
    expect.assertions(2);
    const onChange = jest.fn();
    const { future, handler } = prepare(onChange);
    const v8n = create([]);
    v8n[VALIDATE]({ value: "foo", onChange: handler });

    await future;

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([], true);
  });

  it("produces on each validation cycle when one validator passed.", async () => {
    expect.assertions(5);

    const onChange = jest.fn();
    const { future, handler } = prepare(onChange);
    const v8n = create([IS_FOO]);
    v8n[VALIDATE]({ value: "foo", onChange: handler });

    await future;

    expect(onChange).toHaveBeenCalledTimes(4);
    expect(onChange).toHaveBeenNthCalledWith(
      1,
      [{ type: "IS_FOO", state: "PENDING" }],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      2,
      [{ type: "IS_FOO", state: "VALIDATING" }],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      3,
      [{ type: "IS_FOO", state: "ACCEPTED" }],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      4,
      [{ type: "IS_FOO", state: "ACCEPTED" }],
      true,
    );
  });

  it("produces only on last validation cycle when onlyOnCompleted was set.", async () => {
    expect.assertions(4);

    {
      const onChange = jest.fn();
      const { future, handler } = prepare(onChange);
      const v8n = create([IS_FOO]);
      v8n[VALIDATE]({ value: "foo", onChange: handler, onlyOnCompleted: true });

      await future;

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(
        [{ type: "IS_FOO", state: "ACCEPTED" }],
        true,
      );
    }
    {
      const onChange = jest.fn();
      const { future, handler } = prepare(onChange);
      const v8n = create([STARTS_FOO, CONTAINS_BAR, ENDS_BAZ]);
      v8n[VALIDATE]({
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
    }
  });

  it("produces snapshots on each validation cycle for all validators when onlyOnCompleted is false.", async () => {
    expect.assertions(9);

    const onChange = jest.fn();
    const { future, handler } = prepare(onChange);
    const v8n = create([STARTS_FOO, CONTAINS_BAR, ENDS_BAZ]);
    v8n[VALIDATE]({
      value: "foobarbaz",
      onChange: handler,
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

  it("cancels next validations after a failed one.", async () => {
    expect.assertions(2);

    const onChange = jest.fn();
    const { future, handler } = prepare(onChange);
    const v8n = create([IS_FOO, IS_BAR, IS_BAZ]);
    v8n[VALIDATE]({
      value: "foo",
      onChange: handler,
      onlyOnCompleted: true,
    });

    await future;

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      [
        { type: "IS_FOO", state: "ACCEPTED" },
        { type: "IS_BAR", state: "REJECTED" },
        { type: "IS_BAZ", state: "CANCELED" },
      ],
      true,
    );
  });

  it("throws when validate called on initable validation.", async () => {
    expect.assertions(2);

    const v8n = create([CONTAINS]);
    expect(v8n.isInitable).toBe(true);
    expect(() =>
      v8n[VALIDATE]({
        value: "foo",
        onChange: () => {},
        onlyOnCompleted: true,
      }),
    ).toThrow(CalledValidateOnInitable);
  });

  it("reveals runtime error and cancels next validations.", async () => {
    expect.assertions(2);

    const onChange = jest.fn();
    const { future, handler } = prepare(onChange);
    const v8n = create([IS_FOO, IS_BOMB, IS_BAZ]);
    v8n[VALIDATE]({
      value: "foo",
      onChange: handler,
      onlyOnCompleted: true,
    });

    await future;

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      [
        { type: "IS_FOO", state: "ACCEPTED" },
        { type: "IS_BOMB", state: "REJECTED", runtimeError: Error() },
        { type: "IS_BAZ", state: "CANCELED" },
      ],
      true,
    );
  });

  it("hides validator with runtime error if follows a rejected validation.", async () => {
    expect.assertions(2);

    const onChange = jest.fn();
    const { future, handler } = prepare(onChange);
    const v8n = create([IS_FOO, IS_BAR, IS_BOMB]);
    v8n[VALIDATE]({
      value: "foo",
      onChange: handler,
      onlyOnCompleted: true,
    });

    await future;

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      [
        { type: "IS_FOO", state: "ACCEPTED" },
        { type: "IS_BAR", state: "REJECTED" },
        { type: "IS_BOMB", state: "CANCELED" },
      ],
      true,
    );
  });
});