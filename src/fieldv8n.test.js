import fieldv8n, { InvalidData } from "./fieldv8n";

beforeAll(() => {
  fieldv8n()
    .registerValidator({
      name: "string",
      type: "IS_STRING",
      method: value =>
        Object.prototype.toString.call(value) === "[object String]",
    })
    .registerValidator({
      name: "min",
      type: "MIN_LENGTH",
      method: init => value => value.length >= init,
      initable: true,
    });
});

describe("A custom validator", () => {
  test("returns awaited result.", async () => {
    const stringData = fieldv8n().compose().string;

    expect(await stringData.validate("hi")).toEqual({
      value: "hi",
      type: "IS_STRING",
      history: ["IS_VALUE"],
    });

    try {
      await stringData.validate(42);
    } catch (error) {
      expect(error).toEqual({
        value: 42,
        type: "IS_STRING",
        error: new InvalidData('Value "42" for IS_STRING is invalid.'),
        history: ["IS_VALUE"],
      });
    }
  });

  test("can be forked & extended.", async () => {
    const stringData = fieldv8n().compose().string;
    const min3Chars = stringData.compose().min(3).string;

    try {
      await min3Chars.validate("hi");
    } catch (error) {
      expect(error).toEqual({
        value: "hi",
        type: "MIN_LENGTH",
        error: new InvalidData('Value "hi" for MIN_LENGTH is invalid.'),
        history: ["IS_VALUE", "IS_STRING"],
      });
    }

    const error = await min3Chars.validate(42).catch(e => e);
    expect(error).toEqual({
      value: 42,
      type: "IS_STRING",
      error: new InvalidData('Value "42" for IS_STRING is invalid.'),
      history: ["IS_VALUE"],
    });
  });

  test("resolves & validates async values.", async () => {
    const stringData = fieldv8n().compose().string;
    const min3Chars = stringData.compose().min(3).string;

    const asyncValue = new Promise(resolve =>
      setTimeout(resolve("hello"), 1000),
    );

    expect(await min3Chars.validate(asyncValue)).toEqual({
      value: "hello",
      type: "MIN_LENGTH",
      history: ["IS_VALUE", "IS_STRING"],
    });
  });
});
