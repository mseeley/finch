/* eslint-env jest */

const { localNameOf } = require("@finch/core");
const log = require("./index");

describe(localNameOf(__filename), () => {
  beforeEach(() => {
    jest.spyOn(global.console, "log").mockImplementation(() => {});
  });

  it("omits optional 'message' parameter", async () => {
    const value = 42;
    const payload = { value, params: {} };

    await log(payload);

    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenLastCalledWith(value);
  });

  it("includes options 'message' parameter", async () => {
    const value = 42;
    const message = "Meaning of life";
    const payload = { value, params: { message } };

    await log(payload);

    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenLastCalledWith(message, value);
  });
});
