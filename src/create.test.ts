import { create, validator, ValidationState } from "./fieldv8n";
import { prepare } from "./testUtils";
import { VALIDATE } from "./shared";
import {
  CalledValidateOnInitable,
  MissingInit,
  InitOrderTypeMismatch,
} from "./exceptions";

describe("Create validation", () => {
  const IS_FOO = validator({
    identifier: "IS_FOO",
    initable: false,
    method: (x: string) => x === "foo",
  });

  const IS_BAR = validator({
    identifier: "IS_BAR",
    initable: false,
    method: (x: string) => x === "bar",
  });

  const IS_BAZ = validator({
    identifier: "IS_BAZ",
    initable: false,
    method: (x: string) => x === "baz",
  });

  const CONTAINS = validator({
    identifier: "CONTAINS",
    initable: true,
    method: (a: string) => (b: string): boolean => new RegExp(a).test(b),
  });

  const STARTS_WITH = validator({
    identifier: "STARTS_WITH",
    initable: true,
    method: (a: string) => (b: string): boolean => b.startsWith(a),
  });

  const IS_BOMB = validator({
    identifier: "IS_BOMB",
    initable: false,
    method: (x: string) => {
      if (x === "foo") {
        throw new Error();
      }
      return x === "boom!";
    },
  });

  const STARTS_FOO = validator({
    identifier: "STARTS_FOO",
    initable: false,
    method: (x: string) => x.startsWith("foo"),
  });

  const CONTAINS_BAR = validator({
    identifier: "CONTAINS_BAR",
    initable: false,
    method: (x: string) => /bar/.test(x),
  });

  const ENDS_BAZ = validator({
    identifier: "ENDS_BAZ",
    initable: false,
    method: (x: string) => x.endsWith("baz"),
  });

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
      [{ type: "IS_FOO", state: ValidationState.Pending }],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      2,
      [{ type: "IS_FOO", state: ValidationState.Validating }],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      3,
      [{ type: "IS_FOO", state: ValidationState.Accepted }],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      4,
      [{ type: "IS_FOO", state: ValidationState.Accepted }],
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
        [{ type: "IS_FOO", state: ValidationState.Accepted }],
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
          { type: "STARTS_FOO", state: ValidationState.Accepted },
          { type: "CONTAINS_BAR", state: ValidationState.Accepted },
          { type: "ENDS_BAZ", state: ValidationState.Accepted },
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
        { type: "STARTS_FOO", state: ValidationState.Pending },
        { type: "CONTAINS_BAR", state: ValidationState.Pending },
        { type: "ENDS_BAZ", state: ValidationState.Pending },
      ],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      2,
      [
        { type: "STARTS_FOO", state: ValidationState.Validating },
        { type: "CONTAINS_BAR", state: ValidationState.Pending },
        { type: "ENDS_BAZ", state: ValidationState.Pending },
      ],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      3,
      [
        { type: "STARTS_FOO", state: ValidationState.Accepted },
        { type: "CONTAINS_BAR", state: ValidationState.Pending },
        { type: "ENDS_BAZ", state: ValidationState.Pending },
      ],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      4,
      [
        { type: "STARTS_FOO", state: ValidationState.Accepted },
        { type: "CONTAINS_BAR", state: ValidationState.Validating },
        { type: "ENDS_BAZ", state: ValidationState.Pending },
      ],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      5,
      [
        { type: "STARTS_FOO", state: ValidationState.Accepted },
        { type: "CONTAINS_BAR", state: ValidationState.Accepted },
        { type: "ENDS_BAZ", state: ValidationState.Pending },
      ],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      6,
      [
        { type: "STARTS_FOO", state: ValidationState.Accepted },
        { type: "CONTAINS_BAR", state: ValidationState.Accepted },
        { type: "ENDS_BAZ", state: ValidationState.Validating },
      ],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      7,
      [
        { type: "STARTS_FOO", state: ValidationState.Accepted },
        { type: "CONTAINS_BAR", state: ValidationState.Accepted },
        { type: "ENDS_BAZ", state: ValidationState.Accepted },
      ],
      false,
    );
    expect(onChange).toHaveBeenNthCalledWith(
      8,
      [
        { type: "STARTS_FOO", state: ValidationState.Accepted },
        { type: "CONTAINS_BAR", state: ValidationState.Accepted },
        { type: "ENDS_BAZ", state: ValidationState.Accepted },
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
        { type: "IS_FOO", state: ValidationState.Accepted },
        { type: "IS_BAR", state: ValidationState.Rejected },
        { type: "IS_BAZ", state: ValidationState.Canceled },
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
        { type: "IS_FOO", state: ValidationState.Accepted },
        {
          type: "IS_BOMB",
          state: ValidationState.Rejected,
          runtimeError: Error(),
        },
        { type: "IS_BAZ", state: ValidationState.Canceled },
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
        { type: "IS_FOO", state: ValidationState.Accepted },
        { type: "IS_BAR", state: ValidationState.Rejected },
        { type: "IS_BOMB", state: ValidationState.Canceled },
      ],
      true,
    );
  });

  it("accepts initial values for initable validators.", async () => {
    expect.assertions(2);

    const onChange = jest.fn();
    const { future, handler } = prepare(onChange);
    const v8n = create([CONTAINS, CONTAINS, ENDS_BAZ, CONTAINS]).init([
      ["CONTAINS", ["foo"]],
      ["CONTAINS", ["bar"]],
      ["CONTAINS", ["baz"]],
    ]);

    v8n[VALIDATE]({
      value: "foobarbaz",
      onChange: handler,
      onlyOnCompleted: true,
    });

    await future;

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      [
        { type: "CONTAINS", state: ValidationState.Accepted },
        { type: "CONTAINS", state: ValidationState.Accepted },
        { type: "ENDS_BAZ", state: ValidationState.Accepted },
        { type: "CONTAINS", state: ValidationState.Accepted },
      ],
      true,
    );
  });

  it("throws on missing init values.", () => {
    expect.assertions(1);

    expect(() =>
      create([CONTAINS, CONTAINS, ENDS_BAZ, CONTAINS]).init([
        ["CONTAINS", ["foo"]],
        ["CONTAINS", ["bar"]],
      ]),
    ).toThrow(MissingInit);
  });

  it("throws on init value order mismatch.", () => {
    expect.assertions(1);

    expect(() =>
      create([CONTAINS, STARTS_WITH, CONTAINS]).init([
        ["CONTAINS", ["foo"]],
        ["CONTAINS", ["bar"]],
        ["STARTS_WITH", ["bar"]],
      ]),
    ).toThrow(InitOrderTypeMismatch);
  });

  it("returns itself when inited and is not initable.", async () => {
    expect.assertions(3);

    const onChange = jest.fn();
    const { future, handler } = prepare(onChange);
    const v8n = create([IS_FOO, IS_BAR, IS_BOMB]);
    const unnecessarilyInited = v8n.init([["CONTAINS", ["foo"]]]);
    v8n[VALIDATE]({
      value: "foo",
      onChange: handler,
      onlyOnCompleted: true,
    });

    await future;

    expect(v8n).toBe(unnecessarilyInited);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      [
        { type: "IS_FOO", state: ValidationState.Accepted },
        { type: "IS_BAR", state: ValidationState.Rejected },
        { type: "IS_BOMB", state: ValidationState.Canceled },
      ],
      true,
    );
  });
});
