'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');

// internal modules
const { omitDefaultRequestParams, constructError, responseValidator } = require('./utils');
const { pageVersions: parser } = require('../response-parsers');

const qsValidParameters = ['sO', 'ps'];

/**
 * Retrieve the versions feed from wiki page.
 *
 * @param  {Object}   query                 Query object that holds information required by request uri.
 * @param  {String}   query.wikiLabel       URL parameter that is unique for every community.
 * @param  {String}   query.pageLabel       URL parameter that is unique for every wiki page.
 * @param  {Object}   options               Additional information used as default for every request options.
 * @param  {Function} callback              [description]
 */
function pageVersions(query = {}, options, callback) {
  const { httpClient } = this;

  const { wikiLabel, pageLabel } = query;

  if (!wikiLabel) {
    const error = constructError('{{query.wikiLabel}} must be defined in [pageVersions] request', 404);
    callback(error);
    return;
  }
  if (!pageLabel) {
    const error = constructError('{{query.pageLabel}} must be defined in [pageVersions] request', 404);
    callback(error);
    return;
  }

  // construct the request options
  const requestOptions = _.merge({}, omitDefaultRequestParams(options), {
    qs: _.defaultsDeep({ category: 'version' }, _.pick(query, qsValidParameters)),
    headers: {
      accept: 'application/atom+xml',
    },
    uri: `{ authType }/api/wiki/${wikiLabel}/page/${pageLabel}/feed`,
  });

  httpClient.makeRequest(requestOptions, (requestError, response, body) => {
    if (requestError) {
      callback(requestError);
      return;
    }

    const responseError = responseValidator(response, requestOptions.headers.accept);

    if (responseError) {
      callback(responseError);
      return;
    }

    callback(null, parser(body));
  });
}

module.exports = pageVersions;
