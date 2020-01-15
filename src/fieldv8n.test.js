import { make, registerValidator } from "./fieldv8n";
import { InvalidData, ValidatorNameExists, TypeExists } from "./exceptions";

beforeAll(() => {
  registerValidator({
    name: "atCharPresent",
    type: "HAS_ONE_AT_CHAR",
    method: email => email.match(/@/g).length === 1,
  });
  registerValidator({
    name: "hasUsername",
    type: "HAS_USERNAME",
    method: email => email.match(/^.+@/) !== null,
  });
  registerValidator({
    name: "hasDomain",
    type: "HAS_DOMAIN_PART",
    method: email => email.match(/@[^.]+\.[^.]+/) !== null,
  });
});

describe("A custom validator", () => {
  test("validates value and throws when invalid.", async () => {
    const emailWithOneAtChar = make().compose().atCharPresent;

    expect.assertions(2);

    expect(await emailWithOneAtChar.validate("hi@hello.com")).toEqual({
      value: "hi@hello.com",
      type: "HAS_ONE_AT_CHAR",
      history: ["IS_VALUE"],
    });

    try {
      await emailWithOneAtChar.validate("hi@@hello.com");
    } catch (error) {
      expect(error).toEqual({
        value: "hi@@hello.com",
        type: "HAS_ONE_AT_CHAR",
        error: new InvalidData(
          'Value "hi@@hello.com" for HAS_ONE_AT_CHAR is invalid.',
        ),
        history: ["IS_VALUE"],
      });
    }
  });

  test("can be composed with more custom validators.", async () => {
    const emailWithBasicParts = make().compose().atCharPresent.hasUsername
      .hasDomain;

    expect.assertions(3);

    expect(await emailWithBasicParts.validate("hi@hello.com")).toEqual({
      value: "hi@hello.com",
      type: "HAS_DOMAIN_PART",
      history: ["IS_VALUE", "HAS_ONE_AT_CHAR", "HAS_USERNAME"],
    });

    try {
      await emailWithBasicParts.validate("@hello.com");
    } catch (error) {
      expect(error).toEqual({
        value: "@hello.com",
        type: "HAS_USERNAME",
        error: new InvalidData(
          'Value "@hello.com" for HAS_USERNAME is invalid.',
        ),
        history: ["IS_VALUE", "HAS_ONE_AT_CHAR"],
      });
    }

    const error = await emailWithBasicParts
      .validate("hi@@hello.com")
      .catch(e => e);
    expect(error).toEqual({
      value: "hi@@hello.com",
      type: "HAS_ONE_AT_CHAR",
      error: new InvalidData(
        'Value "hi@@hello.com" for HAS_ONE_AT_CHAR is invalid.',
      ),
      history: ["IS_VALUE"],
    });
  });

  test("can be forked & extended.", async () => {
    const emailWithOneAtChar = make().compose().atCharPresent;
    const emailWithBasicParts = emailWithOneAtChar.compose().hasUsername
      .hasDomain;

    expect.assertions(2);

    expect(await emailWithOneAtChar.validate("@")).toEqual({
      value: "@",
      type: "HAS_ONE_AT_CHAR",
      history: ["IS_VALUE"],
    });

    try {
      await emailWithBasicParts.validate("@");
    } catch (error) {
      expect(error).toEqual({
        value: "@",
        type: "HAS_USERNAME",
        error: new InvalidData('Value "@" for HAS_USERNAME is invalid.'),
        history: ["IS_VALUE", "HAS_ONE_AT_CHAR"],
      });
    }
  });

  test("resolves & validates async values and works with async validators.", async () => {
    const emailWithBasicParts = make().compose().atCharPresent.hasUsername
      .hasDomain;

    const asyncValue = new Promise(resolve =>
      setTimeout(resolve("hi@hello.com"), 1000),
    );

    expect.assertions(2);

    expect(await emailWithBasicParts.validate(asyncValue)).toEqual({
      value: "hi@hello.com",
      type: "HAS_DOMAIN_PART",
      history: ["IS_VALUE", "HAS_ONE_AT_CHAR", "HAS_USERNAME"],
    });

    registerValidator({
      name: "isRegistered",
      type: "REGISTERED",
      method: () => new Promise(resolve => setTimeout(resolve(true), 1000)),
    });

    const asyncEmailValidation = emailWithBasicParts.compose().isRegistered;

    expect(await asyncEmailValidation.validate(asyncValue)).toEqual({
      value: "hi@hello.com",
      type: "REGISTERED",
      history: [
        "IS_VALUE",
        "HAS_ONE_AT_CHAR",
        "HAS_USERNAME",
        "HAS_DOMAIN_PART",
      ],
    });
  });
});

describe("Registering a validator", () => {
  test("more than once throws exception.", () => {
    expect(() =>
      registerValidator({
        name: "atCharPresent",
        type: "DIFFERENT_HAS_ONE_AT_CHAR",
        method: email => email.match(/@/g).length === 1,
      }),
    ).toThrow(ValidatorNameExists);
    expect(() =>
      registerValidator({
        name: "differentAtCharPresent",
        type: "HAS_ONE_AT_CHAR",
        method: email => email.match(/@/g).length === 1,
      }),
    ).toThrow(TypeExists);
  });
});
