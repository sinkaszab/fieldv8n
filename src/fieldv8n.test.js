import fieldv8n from "./fieldv8n";

beforeAll(() => {
  fieldv8n
    .registerValidator({
      name: "string",
      type: "IS_STRING",
      method: value =>
        Object.prototype.toString.call(value) === "[object String]"
    })
    .registerValidator({
      name: "min",
      type: "MIN_LENGTH",
      method: init => value => value.length >= init,
      initable: true
    });
});

describe("A custom validator", () => {
  test("validating strings behaves well.", async done => {
    const stringData = fieldv8n.compose().string;

    const {
      value: valueA,
      valid: validA,
      type: typeA,
      history: historyA
    } = await stringData.validate("hi");

    expect(valueA).toBe("hi");
    expect(validA).toBe(true);
    expect(typeA).toBe("IS_STRING");
    expect(historyA).toEqual(["IS_VALUE"]);

    const {
      value: valueB,
      valid: validB,
      type: typeB,
      history: historyB
    } = await stringData.validate(42);

    expect(valueB).toBe(42);
    expect(validB).toBe(false);
    expect(typeB).toBe("IS_STRING");
    expect(historyB).toEqual(["IS_VALUE"]);

    done();
  });

  test("can be forked & extended.", async done => {
    const stringData = fieldv8n.compose().string;
    const min3Chars = stringData.compose().min(3).string;

    const {
      value: valueA,
      valid: validA,
      type: typeA,
      history: historyA
    } = await min3Chars.validate("hi");

    expect(valueA).toBe("hi");
    expect(validA).toBe(false);
    expect(typeA).toBe("MIN_LENGTH");
    expect(historyA).toEqual(["IS_VALUE", "IS_STRING"]);

    const {
      value: valueB,
      valid: validB,
      type: typeB,
      history: historyB
    } = await min3Chars.validate(42);

    expect(valueB).toBe(42);
    expect(validB).toBe(false);
    expect(typeB).toBe("IS_STRING");
    expect(historyB).toEqual(["IS_VALUE"]);
    done();
  });

  test("resolves & validates async values.", async done => {
    const stringData = fieldv8n.compose().string;
    const min3Chars = stringData.compose().min(3).string;

    const asyncValue = new Promise(resolve =>
      setTimeout(resolve("hello"), 1000)
    );

    const { value, valid, type, history } = await min3Chars.validate(
      asyncValue
    );

    expect(value).toBe("hello");
    expect(valid).toBe(true);
    expect(type).toBe("MIN_LENGTH");
    expect(history).toEqual(["IS_VALUE", "IS_STRING"]);
    done();
  });
});
