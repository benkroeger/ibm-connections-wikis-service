'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');

// internal modules
const { omitDefaultRequestParams, responseParser } = require('./utils');
const { mediaContent: parser } = require('../response-parsers');

const contentPathRegex = /^https?:\/\/[^/]+\/wikis\/(.+)/;
const selectFirstPath = /(.+?)\//;
const injectAuthTypeTemplate = contentPath => contentPath.replace(selectFirstPath, '{ mediaAuthType }/');

const qsValidParameters = [];

/**
 * Retrieve feed of media content. Used by version and wiki page.
 *
 * @param  {Object}   query                   Query object that holds information required by request uri.
 * @param  {Object}   options                 Additional information used as default for every request options.
 * @param  {String}   options.content         Content src acquired from wikiPage or wikiVersionDetails entry.
 * @param  {Function} callback                [description]
 */
function mediaContent(query, options = {}, callback) {
  const { httpClient } = this;

  const { content } = options;

  // parse content uri
  const uri = ((url) => {
    if (!url) {
      return url;
    }
    // e.x. https://baseUrl.com/wikis/oauth/some/path
    // need to strip this path to oauth/some/path and replace 'oauth' with our custom { mediaAuthType } template
    // This is necessary due different authType's required by different environments.
    // Now we can easily set { mediaAuthType } via 'serviceOptions' directly from an environment.
    const [, contentPath] = contentPathRegex.exec(url);
    return injectAuthTypeTemplate(contentPath);
  })(content);

  // construct the request options
  const requestOptions = _.merge({}, omitDefaultRequestParams(options), {
    qs: _.pick(query, qsValidParameters),
    headers: {
      accept: 'text/html',
    },
    uri,
  });

  httpClient.makeRequest(requestOptions, (requestError, response, body) => {
    if (requestError) {
      callback(requestError);
      return;
    }

    const error = responseParser(response, requestOptions.headers.accept);

    callback(error, parser(body));
  });
}

module.exports = mediaContent;
