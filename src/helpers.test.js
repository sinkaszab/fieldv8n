import { identifierMatchesStyle } from "./helpers";

describe("An identifier", () => {
  test("succeeds style when starts or ends with uppercase letter.", () => {
    const SUCCEEDING_IDENTIFIERS = [
      "HELLO",
      "HELLO",
      "HELLO",
      "HEL",
      "HE",
      "H",
    ];
    const allSucceeded = SUCCEEDING_IDENTIFIERS.map((identifier) => ({
      identifier,
    })).every((config) => identifierMatchesStyle(config));
    expect(allSucceeded).toBe(true);
  });

  test("succeeds style when underbar is surrounded by uppercase letters.", () => {
    const SUCCEEDING_IDENTIFIERS = ["HELLO_WORLD", "H_W", "H_E_L_L_O"];
    const allSucceeded = SUCCEEDING_IDENTIFIERS.map((identifier) => ({
      identifier,
    })).every((config) => identifierMatchesStyle(config));
    expect(allSucceeded).toBe(true);
  });

  test("fails style when starts or ends with underbar.", () => {
    const FAILING_IDENTIFIERS = ["_HELLO", "HELLO_", "_HELLO_", "_"];
    const allFailed = FAILING_IDENTIFIERS.map((identifier) => ({
      identifier,
    })).every((config) => !identifierMatchesStyle(config));
    expect(allFailed).toBe(true);
  });

  test("fails style when contains lower case letter.", () => {
    const FAILING_IDENTIFIERS = ["HeLLO", "HeO", "Ho", "o"];
    const allFailed = FAILING_IDENTIFIERS.map((identifier) => ({
      identifier,
    })).every((config) => !identifierMatchesStyle(config));
    expect(allFailed).toBe(true);
  });
});
