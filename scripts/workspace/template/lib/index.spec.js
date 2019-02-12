/* eslint-env jest */
const helloWorld = require("./index");

describe("Hello world", () => {
  test("Returns expected response", () => {
    expect(helloWorld()).toEqual("Hello world");
  });
});
