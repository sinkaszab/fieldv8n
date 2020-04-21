import validator from "./validator";
import { MethodNeedsToBeAFunction, InvalidIdentifierStyle } from "./exceptions";
import {
  InitableValidator,
  ValidatorConfig,
  FinalValidator,
} from "./interfaces";

describe("Creating a validator from config", () => {
  it("throws when identifier styleguide is not followed.", () => {
    expect.assertions(1);

    expect(() =>
      validator({
        identifier: "_STYLE_Fail_",
        initable: false,
        method: (x: unknown) => !!x,
      }),
    ).toThrow(InvalidIdentifierStyle);
  });

  it("throws when method is not a function.", () => {
    expect.assertions(2);

    expect(() =>
      validator({
        identifier: "IDENT",
        initable: false,
      } as ValidatorConfig),
    ).toThrow(MethodNeedsToBeAFunction);

    expect(() =>
      validator(({
        identifier: "IDENT",
        initable: false,
        method: "hello",
      } as unknown) as ValidatorConfig),
    ).toThrow(MethodNeedsToBeAFunction);
  });

  it("returns a factory where produced instances are different.", () => {
    expect.assertions(2);

    const finalFactory = validator({
      identifier: "VALIDATE",
      initable: false,
      method: (x: unknown) => !!x,
    });

    expect(finalFactory()).not.toBe(finalFactory());

    const initableFactory = validator({
      identifier: "VALIDATE",
      initable: true,
      method: (p: unknown) => (x: unknown): boolean => p !== x,
    });

    expect((initableFactory() as InitableValidator).init("a")).not.toBe(
      (initableFactory() as InitableValidator).init("a"),
    );
  });
});

describe("Validator", () => {
  it("validates field input value.", () => {
    expect.assertions(1);

    const factory = validator({
      identifier: "IS_FOO",
      initable: false,
      method: (foo: string) => foo === "foo",
    });
    const inst = factory() as FinalValidator;
    expect(inst.validate("foo")).toBe(true);
  });

  it("validates field input value with setting inital value.", () => {
    expect.assertions(2);

    const factory = validator({
      identifier: "IS_FOO_BAR",
      initable: true,
      method: (foo: string) => (bar: string): boolean => foo + bar === "foobar",
    });
    const inst = factory() as InitableValidator;

    const foobar = inst.init("foo");
    expect(foobar.validate("bar")).toBe(true);

    const bazbar = inst.init("baz");
    expect(bazbar.validate("bar")).toBe(false);
  });
});
