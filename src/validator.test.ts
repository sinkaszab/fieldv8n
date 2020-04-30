import { validator } from "./fieldv8n";
import { MethodNeedsToBeAFunction, InvalidIdentifierStyle } from "./exceptions";
import { InitableValidator, ValidatorConfig, FinalValidator } from "./shared";

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
    expect.assertions(1);

    const v8n = validator({
      identifier: "VALIDATE",
      initable: true,
      method: (p: string) => (x: string): boolean => p !== x,
    }) as InitableValidator;

    expect(v8n.init("a")).not.toBe(v8n.init("a"));
  });
});

describe("Validator", () => {
  it("validates field input value.", () => {
    expect.assertions(1);

    const v8n = validator({
      identifier: "IS_FOO",
      initable: false,
      method: (foo: string) => foo === "foo",
    }) as FinalValidator;

    expect(v8n.validate("foo")).toBe(true);
  });

  it("validates field input value with setting inital value.", () => {
    expect.assertions(3);

    const v8n = validator({
      identifier: "IS_FOO_BAR",
      initable: true,
      method: (foo: string) => (bar: string): boolean => foo + bar === "foobar",
    }) as InitableValidator;

    const foobar = v8n.init("foo");
    expect(foobar.validate("bar")).toBe(true);

    const bazbar = v8n.init("baz");

    expect(bazbar.validate("bar")).toBe(false);
    expect(foobar.validate("bar")).toBe(true);
  });
});
