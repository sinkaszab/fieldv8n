import { make, registerValidator } from "./fieldv8n";
import {
  InvalidData,
  ValidatorNameExists,
  TypeExists,
  ValidatorRuntimeError,
} from "./exceptions";

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
  registerValidator({
    name: "maxCharacters",
    type: "CHAR_LIMIT",
    method: n => str => str.length <= n,
    initable: true,
  });
});

test("A bare composition doesn't yet have a validate function.", () => {
  const barebones = make().compose();

  expect.assertions(1);

  expect(() => barebones.validate()).toThrow(
    "barebones.validate is not a function",
  );
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

  test("can be initialized with a custom value.", async () => {
    const isShortID = make()
      .compose()
      .maxCharacters(5);

    const isLongID = make()
      .compose()
      .maxCharacters(10);

    expect.assertions(4);

    expect(await isShortID.validate("HELLO")).toEqual({
      value: "HELLO",
      type: "CHAR_LIMIT",
      history: ["IS_VALUE"],
    });

    try {
      await isShortID.validate("NOTSHORTFORSURE");
    } catch (error) {
      expect(error).toEqual({
        value: "NOTSHORTFORSURE",
        type: "CHAR_LIMIT",
        error: new InvalidData(
          'Value "NOTSHORTFORSURE" for CHAR_LIMIT is invalid.',
        ),
        history: ["IS_VALUE"],
      });
    }

    expect(await isLongID.validate("HELLOWORLD")).toEqual({
      value: "HELLOWORLD",
      type: "CHAR_LIMIT",
      history: ["IS_VALUE"],
    });

    try {
      await isLongID.validate("MORETHANCHARSOFTEN");
    } catch (error) {
      expect(error).toEqual({
        value: "MORETHANCHARSOFTEN",
        type: "CHAR_LIMIT",
        error: new InvalidData(
          'Value "MORETHANCHARSOFTEN" for CHAR_LIMIT is invalid.',
        ),
        history: ["IS_VALUE"],
      });
    }
  });

  test("can be composed with more custom validators.", async () => {
    const emailWithBasicParts = make().compose().atCharPresent.hasUsername
      .hasDomain;

    expect.assertions(2);

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
  });

  test("can be used in Promise chain style with then.", () => {
    const emailWithBasicParts = make().compose().atCharPresent.hasUsername
      .hasDomain;

    expect.assertions(1);

    return emailWithBasicParts.validate("hi@hello.com").then(result =>
      expect(result).toEqual({
        value: "hi@hello.com",
        type: "HAS_DOMAIN_PART",
        history: ["IS_VALUE", "HAS_ONE_AT_CHAR", "HAS_USERNAME"],
      }),
    );
  });

  test("can be used in Promise chain style with catch.", () => {
    const emailWithBasicParts = make().compose().atCharPresent.hasUsername
      .hasDomain;

    expect.assertions(1);

    return emailWithBasicParts.validate("hi@@hello.com").catch(error =>
      expect(error).toEqual({
        value: "hi@@hello.com",
        type: "HAS_ONE_AT_CHAR",
        error: new InvalidData(
          'Value "hi@@hello.com" for HAS_ONE_AT_CHAR is invalid.',
        ),
        history: ["IS_VALUE"],
      }),
    );
  });

  test("can be used in Promise chain style with catch after then.", () => {
    const emailWithBasicParts = make().compose().atCharPresent.hasUsername
      .hasDomain;

    const nonCalledHandler = jest.fn();

    expect.assertions(2);

    return emailWithBasicParts
      .validate("hi@@hello.com")
      .then(nonCalledHandler)
      .catch(error =>
        expect(error).toEqual({
          value: "hi@@hello.com",
          type: "HAS_ONE_AT_CHAR",
          error: new InvalidData(
            'Value "hi@@hello.com" for HAS_ONE_AT_CHAR is invalid.',
          ),
          history: ["IS_VALUE"],
        }),
      )
      .then(() => expect(nonCalledHandler).not.toHaveBeenCalled());
  });

  test("can be used in Promise chain style with then(onFulfilled, _).", () => {
    const emailWithBasicParts = make().compose().atCharPresent.hasUsername
      .hasDomain;

    const nonCalledHandler = jest.fn();

    expect.assertions(2);

    return emailWithBasicParts
      .validate("hi@hello.com")
      .then(
        result =>
          expect(result).toEqual({
            value: "hi@hello.com",
            type: "HAS_DOMAIN_PART",
            history: ["IS_VALUE", "HAS_ONE_AT_CHAR", "HAS_USERNAME"],
          }),
        nonCalledHandler,
      )
      .then(() => expect(nonCalledHandler).not.toHaveBeenCalled());
  });

  test("can be used in Promise chain style with then(_, onRejected).", () => {
    const emailWithBasicParts = make().compose().atCharPresent.hasUsername
      .hasDomain;

    const nonCalledHandler = jest.fn();

    expect.assertions(2);

    return emailWithBasicParts
      .validate("hi@@hello.com")
      .then(nonCalledHandler, error =>
        expect(error).toEqual({
          value: "hi@@hello.com",
          type: "HAS_ONE_AT_CHAR",
          error: new InvalidData(
            'Value "hi@@hello.com" for HAS_ONE_AT_CHAR is invalid.',
          ),
          history: ["IS_VALUE"],
        }),
      )
      .then(() => expect(nonCalledHandler).not.toHaveBeenCalled());
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

  test("with the initial type throws exception.", () => {
    const INIT_TYPE = "IS_VALUE";
    expect(() =>
      registerValidator({
        name: "myBannedValidator",
        type: INIT_TYPE,
        method: x => x,
      }),
    ).toThrow(TypeExists);
  });
});

describe("A runtime error in a validation function", () => {
  test("will throw ValidatorRuntimeError.", async () => {
    registerValidator({
      name: "runtimeBomb",
      type: "RUNTIME_ERROR",
      method: x => x.thisWillThrow(),
    });
    expect.assertions(3);
    try {
      await make()
        .compose()
        .runtimeBomb.validate("ooops");
    } catch (error) {
      expect(error.error).toBeInstanceOf(ValidatorRuntimeError);
      expect(error).toHaveProperty("runtimeError");
      expect(error).toEqual({
        value: "ooops",
        type: "RUNTIME_ERROR",
        error: new ValidatorRuntimeError(
          '"RUNTIME_ERROR" threw error during validation.',
        ),
        history: ["IS_VALUE"],
        runtimeError: new TypeError("x.thisWillThrow is not a function"),
      });
    }
  });
});
