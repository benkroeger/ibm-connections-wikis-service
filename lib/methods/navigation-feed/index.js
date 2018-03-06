'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');
const debug = require('debug')('ibm-connections:wikis:methods:navigation-feed');

// internal modules
const { omitDefaultRequestParams, constructError, responseValidator } = require('./../utils');
const handleMultipleRequests = require('./handle-multiple-requests');

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

  const qsValidParameters = ['parent'];
  const { wikiLabel } = query;

  if (!wikiLabel) {
    const error = constructError('{{query.wikiLabel}} must be defined in [navigationFeed] request', 404);
    callback(error);
    return;
  }

  // construct the request options
  const requestOptions = _.merge(
    omitDefaultRequestParams(options), {
    qs: _.pick(query, qsValidParameters),
    headers: {
      accept: 'application/json',
    },
    uri: `{ authType }/api/wiki/${wikiLabel}/nav/feed`,
    json: true,
  });

  httpClient.makeRequest(requestOptions, (requestError, response, body = {}) => {
    if (requestError) {
      callback(requestError);
      return;
    }
    const responseError = responseValidator(response, requestOptions.headers.accept);

    if (responseError) {
      callback(responseError);
      return;
    }

    const { isStubTypeAllowed, plugins: { cache: { delayCaching } } } = requestOptions;
    const { fromCache } = response;

    // validate if we have stub items
    const hasStubType = checkForStubType(body.items || []);

    // verify that stubType is allowed by the request options or if we do not have stubType in our response data
    if (isStubTypeAllowed || !hasStubType) {
      // cache the data only if it doesn't come from the cache already and if delayCaching is set to true
      if (!fromCache && delayCaching) {
        response.emit('addToCache', { data: body });
      }
      
      // if data has come from the cache, wrap in within object
      // otherwise it already comes as object
      callback(null, fromCache ? { items: body } : body);
      return;
    }

    // at this point, we know that stubType is not allowed, and that we have a stubType in our response data.
    // if the response is not from the cache, we need to make multiple requests in order to collect
    // the data and build full navigation tree
    if (!fromCache) {
      // there is no point in invoking ".handleMultipleRequests()" method if delayCaching is off,
      // since event listener would not be registered. Notify caller
      if (!delayCaching) {
        const error = '"delayCaching" must be true when stubType is not allowed and response body has stub items';
        debug(error);

        // we want to remove any data that was cached unintentionally,
        // since data might be cached while "delayCaching" was off
        response.emit('removeFromCache');
        callback(constructError(error, 400));
        return;
      }

      handleMultipleRequests({ httpClient, requestOptions, response, body, callback });
      return;
    }

    const modifiedOptions = _.defaultsDeep({
      phasesToSkip: {
        requestPhases: ['cache'],
      },
    }, options);

    // if the data came from the cache, we can't provide this version to the caller,
    // since this version contains stubType data, which is not allowed.
    // we re-initiate the same request while skipping the "cache" request phase list handler
    // which resolves to invoking ".handleMultipleRequests()" method
    self.navigationFeed(query, modifiedOptions, callback);
  });
}

module.exports = navigationFeed;
