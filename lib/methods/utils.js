'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');

// internal modules

const omitDefaultRequestParams = (params, extraOmmit = []) =>
  _.omit(params, ['uri', 'url', 'method', 'qs', 'baseUrl', ...extraOmmit]);

function constructError(message, statusCode) {
  const error = new Error(message);
  error.httpStatus = statusCode;
  return error;
}

// parse response received from the origin server
const responseParser = (response, validContentType) => {
  const { body, statusCode, headers = {} } = response;
  const { 'content-type': contentType } = headers;

  // expected
  // status codes: 200, 403, 404
  if (statusCode !== 200) {
    return constructError(body || 'received response with unexpected status code', statusCode);
  }

  if (!contentType.startsWith(validContentType)) {
    return constructError(`received response with unexpected content-type ${contentType}`, 401);
  }

  return null;
};

module.exports = {
  responseParser,
  constructError,
  omitDefaultRequestParams,
};
