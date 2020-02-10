/* eslint-env jest */

const promiseResolveIfEvenElseReject = require("./promise-resolve-if-even-else-reject");

// Jest is configured to automatically clear mocks between every test.
module.exports = jest.fn(promiseResolveIfEvenElseReject);
