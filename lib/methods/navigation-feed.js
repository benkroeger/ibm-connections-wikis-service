'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');

// internal modules
const { omitDefaultRequestParams, constructError } = require('./utils');
const handleMultipleRequest = require('./handle-multiple-request-navigation-feed');
const handleSingleRequest = require('./handle-single-request-navigation-feed');

const checkForStubType = items => items.some(item => item.type === 'stub');

/**
 * Retrieve navigation feed structure that belongs to a community.
 *
 * @param  {Object}   query               Query object that holds information required by request uri.
 * @param  {String}   query.wikiLabel     URL parameter that is unique for every community
 * @param  {Object}   options             Additional information used as default for every request options.
 * @param  {Function} callback            [description]
 */
function navigationFeed(query = {}, options, callback) {
  const self = this;
  const { httpClient } = self;

  const qsValidParameters = ['breadcrumb', 'parent', 'timestamp'];
  const { wikiLabel } = query;

  if (!wikiLabel) {
    const error = constructError('{{query.wikiLabel}} must be defined in [navigationFeed] request', 404);
    callback(error);
    return;
  }

  // construct the request options
  const requestOptions = _.merge({
    isStubTypeAllowed: false,
  }, omitDefaultRequestParams(options), {
    qs: _.pick(query, qsValidParameters),
    headers: {
      accept: 'application/atom+xml',
    },
    uri: `basic/api/wiki/${wikiLabel}/nav/feed`,
    json: true,
  });

  httpClient.makeRequest(requestOptions, (requestError, response, body = {}) => {
    if (requestError) {
      callback(requestError);
      return;
    }

    // setup response validators
    const { fromCache } = response;
    const { isStubTypeAllowed } = requestOptions;
    const hasStubType = checkForStubType(body.items || []);

    if (isStubTypeAllowed || !hasStubType) {
      handleSingleRequest(response, body, !fromCache, callback);
      return;
    }
    if (!fromCache) {
      handleMultipleRequest({ httpClient, requestOptions, response, body, callback });
      return;
    }

    const modifiedOptions = _.defaultsDeep({
      phasesToSkip: {
        requestPhases: ['cache'],
      },
    }, options);
    self.navigationFeed(query, modifiedOptions, callback);
  });
}

module.exports = navigationFeed;
