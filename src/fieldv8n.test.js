import fieldv8n from "./fieldv8n";

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
  test("returns awaited result.", async done => {
    const stringData = fieldv8n().compose().string;

    expect(await stringData.validate("hi")).toEqual({
      value: "hi",
      valid: true,
      type: "IS_STRING",
      history: ["IS_VALUE"],
    });

    expect(await stringData.validate(42)).toEqual({
      value: 42,
      valid: false,
      type: "IS_STRING",
      history: ["IS_VALUE"],
    });

    done();
  });

  test("can be forked & extended.", async done => {
    const stringData = fieldv8n().compose().string;
    const min3Chars = stringData.compose().min(3).string;

    expect(await min3Chars.validate("hi")).toEqual({
      value: "hi",
      valid: false,
      type: "MIN_LENGTH",
      history: ["IS_VALUE", "IS_STRING"],
    });

    expect(await min3Chars.validate(42)).toEqual({
      value: 42,
      valid: false,
      type: "IS_STRING",
      history: ["IS_VALUE"],
    });

    done();
  });

  test("resolves & validates async values.", async done => {
    const stringData = fieldv8n().compose().string;
    const min3Chars = stringData.compose().min(3).string;

    const asyncValue = new Promise(resolve =>
      setTimeout(resolve("hello"), 1000)
    );

    expect(await min3Chars.validate(asyncValue)).toEqual({
      value: "hello",
      valid: true,
      type: "MIN_LENGTH",
      history: ["IS_VALUE", "IS_STRING"],
    });

    done();
  });
});
