import validator from "./validator";
import { NoMethodDefined, InvalidIdentifierStyle } from "./exceptions";

describe("Creating a validator from config", () => {
  it("throws when no method is specified.", () => {
    expect(() => validator({ identifier: "FAIL" })).toThrow(NoMethodDefined);
  });

  it("throws when identifier styleguide is not followed.", () => {
    expect(() => validator({ identifier: "_STYLE_Fail_" })).toThrow(
      InvalidIdentifierStyle,
    );
  });

  it("returns a factory where produced instances are different.", () => {
    const factory = validator({ identifier: "VALIDATE", method: () => true });
    expect(factory()).not.toBe(factory());
  });
});
