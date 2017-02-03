'use strict';
// node core modules
const util = require('util');

// 3rd party modules
const _ = require('lodash');
const q = require('q');
const OniyiHttpClient = require('oniyi-http-client');

// internal modules
const xml = require('./lib/xml-utils');

// local variable definitions
const xmlNS = {
  atom: 'http://www.w3.org/2005/Atom',
  snx: 'http://www.ibm.com/xmlns/prod/sn',
  app: 'http://www.w3.org/2007/app',
  openSearch: 'http://a9.com/-/spec/opensearch/1.1/',
  ibmsc: 'http://www.ibm.com/search/content/2010',
  td: 'urn:ibm.com/td',
  thr: 'http://purl.org/syndication/thread/1.0',
  fh: 'http://purl.org/syndication/history/1.0',
};

// local function definition
function getAuthPath(requestOptions) {
  if (requestOptions.auth && _.isString(requestOptions.auth.bearer)) {
    return 'oauth';
  }
  return 'basic';
}

/**
 *  The makeRequest function can take two or three arguments
 *  the last has to be a function (which is done by q.ninvoke --> passes a callback with node conventions (err, data))
 *
 * @param {Object}  self             Instance of OniyiHttpClient
 * @param {String}  requestMethod    Method name that belongs to self instance
 * @param {Object}  requestOptions   Additional options that goes together with request
 * @param {Function}  parser         It is a parsing method that belongs to { responseParser }
 * @returns {Function|*}             Returns a promise
 */
function promiseReturn(self, requestMethod, requestOptions, parser) {
  return q.ninvoke(self, requestMethod, requestOptions)
    .spread((response, body) => {
      // expected
      // status codes: 200, 401, 404
      // content-type: application/atom+xml
      if (!response || response.statusCode !== 200) {
        return q.reject(new Error('received invalid response'));
      }

      return parser(body);
    })
    .catch(err => q.reject(err));
}

/**
 *
 * @param {Object} self               Instance of OniyiHttpClient
 * @param {Object} options            Options parameter
 * @param {Object} qsValidParameters  Valid request paramters, defined by ibm doc
 * @param {String} requestUri         Simple endpoint string, can be 'feed', 'feed?category=version',
 *                                    'entry', 'version/{versionId}'
 * @param {Function} parser           It is a parsing method that belongs to { responseParser }
 * @returns {Function|*}              Returns a promise
 */
function commonApiRequest(self, options, qsValidParameters, requestUri, parser) {
  let error;

  if (!options.wikiLabel) {
    error = new Error('options.wikiLabel must be defined');
    error.httpStatus = 400;
    return q.reject(error);
  }

  if (!options.pageLabel) {
    error = new Error('options.pageLabel must be defined');
    error.httpStatus = 400;
    return q.reject(error);
  }

  // construct the request options
  const requestOptions = _.merge(self.extractRequestParams(options, ['baseUrl', 'uri', 'method', 'qs']), {
    qs: _.pick(options, qsValidParameters),
  });

  const authPath = getAuthPath(requestOptions);

  requestOptions.uri = `wikis/${authPath}/api/wiki/${options.wikiLabel}/page/${options.pageLabel}/${requestUri}`;

  return promiseReturn(self, 'makeRequest', requestOptions, parser);
}

// // here begins the parser functions definition section
const responseParser = {
  // parser for myWikis/feed, should contain only id and title
  wikisFeedParser: function parseWikisFeedResponse(responseXML) {
    if (_.isString(responseXML)) {
      responseXML = xml.parse(responseXML); // eslint-disable-line no-param-reassign
    }

    return Array.prototype.map.call(responseXML.getElementsByTagName('entry'), (element) => {
      const entry = {};
      entry.id = element.getElementsByTagName('id')[0].textContent;
      entry.title = (xml.find(element, 'title[type="text"]')[0]).textContent;
      return entry;
    });
  },
  // parser for /wiki/{wikiId}/feed, each element should contain only id and title
  pagesFeedParser: function parsePagesFeedResponse(responseXML) {
    if (_.isString(responseXML)) {
      responseXML = xml.parse(responseXML); // eslint-disable-line no-param-reassign
    }

    return Array.prototype.map.call(responseXML.getElementsByTagName('entry'),
      (element) => {
        const entry = {};
        entry.id = element.getElementsByTagName('id')[0].textContent;
        entry.title = (xml.find(element, 'title[type="text"]')[0]).textContent;
        return entry;
      }
    );
  },
  // main wikiPage, /wiki/{wikiId}/page/{pageId}/entry
  pageEntryParser: function parsePageEntryResponse(responseXML) {
    if (_.isString(responseXML)) {
      responseXML = xml.parse(responseXML); // eslint-disable-line no-param-reassign
    }
    const entry = {};
    const author = responseXML.getElementsByTagName('author')[0];

    entry.id = responseXML.getElementsByTagName('id')[0].textContent;
    entry.title = (xml.find(responseXML, 'title[type="text"]')[0]).textContent;
    entry.content = (xml.find(responseXML, 'content[type="text/html"]')[0]).getAttribute('src');
    entry.links = {
      self: (xml.find(responseXML, 'link[rel="self"]')[0]).getAttribute('href'),
      edit: (xml.find(responseXML, 'link[rel="edit"]')[0]).getAttribute('href'),
      editMedia: (xml.find(responseXML, 'link[rel="edit-media"]')[0]).getAttribute('href'),
      enclosure: (xml.find(responseXML, 'link[rel="enclosure"]')[0]).getAttribute('href'),
      related: (xml.find(responseXML, 'link[rel="related"]')[0]).getAttribute('href'),
      replies: (xml.find(responseXML, 'link[rel="replies"]')[0]).getAttribute('href'),
    };
    entry.author = {
      id: author.getElementsByTagNameNS(xmlNS.snx, 'userid')[0].textContent,
      displayName: author.getElementsByTagName('name')[0].textContent,
    };
    entry.updatedAt = responseXML.getElementsByTagName('updated')[0].textContent;

    return entry;
  },
  // parser retrieving comments from certain page, /wiki/{wikiId}/page/{pageId}/feed
  commentParser: function parseCommentResponse(responseXML) {
    if (_.isString(responseXML)) {
      responseXML = xml.parse(responseXML); // eslint-disable-line no-param-reassign
    }
    return Array.prototype.map.call(responseXML.getElementsByTagName('entry'), (element) => {
      const entry = {};
      const author = element.getElementsByTagName('author')[0];

      entry.id = element.getElementsByTagName('id')[0].textContent;
      entry.content = (xml.find(element, 'content[type="text"]')[0]).textContent;
      entry.author = {
        id: author.getElementsByTagNameNS(xmlNS.snx, 'userid')[0].textContent,
        displayName: author.getElementsByTagName('name')[0].textContent,
      };
      entry.updatedAt = element.getElementsByTagName('updated')[0].textContent;
      return entry;
    });
  },
  // parser retrieving version from certain page, /wiki/{wikiId}/page/{pageId}/feed?category=version
  // category sent as param
  versionsPageParser: function parseVersionsPageResponse(responseXML) {
    if (_.isString(responseXML)) {
      responseXML = xml.parse(responseXML); // eslint-disable-line no-param-reassign
    }
    const entry = {};
    const author = responseXML.getElementsByTagName('author')[0];

    entry.id = responseXML.getElementsByTagName('id')[0].textContent;
    entry.number = responseXML.getElementsByTagNameNS(xmlNS.td, 'versionLabel')[0].textContent;
    entry.links = {
      self: (xml.find(responseXML, 'link[rel="self"]')[0]).getAttribute('href'),
      alternate: (xml.find(responseXML, 'link[rel="alternate"]')[0]).getAttribute('href'),
      edit: (xml.find(responseXML, 'link[rel="edit"]')[0]).getAttribute('href'),
      editMedia: (xml.find(responseXML, 'link[rel="edit-media"]')[0]).getAttribute('href'),
      enclosure: (xml.find(responseXML, 'link[rel="enclosure"]')[0]).getAttribute('href'),
    };
    entry.author = {
      id: author.getElementsByTagNameNS(xmlNS.snx, 'userid')[0].textContent,
      displayName: author.getElementsByTagName('name')[0].textContent,
    };
    entry.updatedAt = responseXML.getElementsByTagName('updated')[0].textContent;
    return entry;
  },
  // retrieving data about single version, when was updated, who was author etc.
  versionPageParser: function parseVersionPageResponse(responseXML) {
    // TODO: find a way to retrieve data from single version entry
    if (_.isString(responseXML)) {
      responseXML = xml.parse(responseXML); // eslint-disable-line no-param-reassign
    }
    const entry = {};
    const author = responseXML.getElementsByTagName('author')[0];

    entry.id = responseXML.getElementsByTagName('id')[0].textContent;
    entry.title = (xml.find(responseXML, 'title[type="text"]')[0]).textContent;
    entry.content = (xml.find(responseXML, 'content[type="text/html"]')[0]).getAttribute('src');
    entry.author = {
      id: author.getElementsByTagNameNS(xmlNS.snx, 'userid')[0].textContent,
      displayName: author.getElementsByTagName('name')[0].textContent,
    };
    entry.links = {
      self: (xml.find(responseXML, 'link[rel="self"]')[0]).getAttribute('href'),
      alternate: (xml.find(responseXML, 'link[rel="alternate"]')[0]).getAttribute('href'),
      edit: (xml.find(responseXML, 'link[rel="edit"]')[0]).getAttribute('href'),
      editMedia: (xml.find(responseXML, 'link[rel="edit-media"]')[0]).getAttribute('href'),
      enclosure: (xml.find(responseXML, 'link[rel="enclosure"]')[0]).getAttribute('href'),
    };
    entry.updatedAt = responseXML.getElementsByTagName('updated')[0].textContent;
    return entry;
  },
  // media parser used for extracting html content from page and version response
  mediaParser: function parsePageEntryResponse(responseXML) {
    if (_.isString(responseXML)) {
      responseXML = xml.parse(responseXML); // eslint-disable-line no-param-reassign
    }

    let result = xml.serialize(responseXML)
      .replace('<?xml version="1.0" encoding="UTF-8"?>', '')
      .replace('<!DOCTYPE html>', '');
    result = _.unescape(result);
    return result;
  },
};

// the "class" definition
function IbmConnectionsWikisService(baseUrl, options) {
  const self = this;

  options = _.merge({ // eslint-disable-line no-param-reassign
    requestOptions: {
      baseUrl,
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
    },
  }, options);

  OniyiHttpClient.call(self, options);

  self.baseUrl = baseUrl;

  // @TODO: generalize this plugin
  self.registerPlugin({
    name: 'response.statusCode',
    callback: function callback(next, err, response, body) {
      if (err || !response) {
        next.call(this, err, response, body);
        return;
      }
      if (response.statusCode !== 200) {
        const error = new Error(body || 'Wrong statusCode');
        error.httpStatus = response.statusCode;
        next.call(this, error, response, body);
        return;
      }
      next.call(this, err, response, body);
    },
  });
}
util.inherits(IbmConnectionsWikisService, OniyiHttpClient);

IbmConnectionsWikisService.prototype.getWikisFeed = function getWikisFeed(options) {
  const self = this;

  const qsValidParameters = [
    'acls',
    'includeTags',
    'page',
    'ps',
    'role',
    'sI',
    'sortBy',
    'sortOrder',
  ];

  // construct the request options
  const requestOptions = _.merge(self.extractRequestParams(options, ['baseUrl', 'uri', 'method', 'qs']), {
    qs: _.pick(options, qsValidParameters),
  });

  const authPath = getAuthPath(requestOptions);

  requestOptions.uri = `wikis/${authPath}/api/mywikis/feed`;

  return promiseReturn(self, 'makeRequest', requestOptions, responseParser.wikisFeedParser);
};

IbmConnectionsWikisService.prototype.getPagesFeed = function getPagesFeed(options) {
  const self = this;
  let error;

  if (!options.wikiLabel) {
    error = new Error('options.wikiLabel must be defined');
    error.httpStatus = 400;
    return q.reject(error);
  }

  const qsValidParameters = [
    'acls',
    'includeTags',
    'page',
    'ps',
    'role',
    'sI',
    'sortBy',
    'sortOrder',
  ];

  // construct the request options
  const requestOptions = _.merge(self.extractRequestParams(options, ['baseUrl', 'uri', 'method', 'qs']), {
    qs: _.pick(options, qsValidParameters),
  });

  const authPath = getAuthPath(requestOptions);

  requestOptions.uri = `wikis/${authPath}/api/wiki/${options.wikiLabel}/feed`;

  return promiseReturn(self, 'makeRequest', requestOptions, responseParser.pagesFeedParser);
};

IbmConnectionsWikisService.prototype.getPageEntry = function getPageEntry(options) {
  const self = this;
  const qsValidParameters = [
    // 'format', // tested this query parameter --> does not have any effect
    'acls',
    'includeTags',
  ];

  return commonApiRequest(self, options, qsValidParameters, 'entry', responseParser.pageEntryParser);
};

IbmConnectionsWikisService.prototype.getPageArtifacts = function getPageArtifacts(options) {
  const self = this;
  const qsValidParameters = [
    // 'format', // tested this query parameter --> does not have any effect
    // sO -> sortOrder, ps -> page size, category-> can be tag,version,attachment and comment
    'sO',
    'ps',
    'category',
  ];
  let parser;

  if (options.category && options.category === 'version') {
    parser = responseParser.versionsPageParser;
  } else {
    parser = responseParser.commentParser;
  }

  return commonApiRequest(self, options, qsValidParameters, 'feed', parser);
};

IbmConnectionsWikisService.prototype.getPageVersion = function getPageVersions(options) {
  // TODO: find the right api call for single version page
  const self = this;
  let error;
  const qsValidParameters = [
    // 'format', // tested this query parameter --> does not have any effect
    // sO -> sortOrder, ps -> page size
    'sO',
    'ps',
  ];
  if (!options.versionLabel) {
    error = new Error('options.versionLabel must be defined');
    error.httpStatus = 400;
    return q.reject(error);
  }
  const uri = `version/${options.versionLabel}/entry`;

  return commonApiRequest(self, options, qsValidParameters, uri, responseParser.versionPageParser);
};

IbmConnectionsWikisService.prototype.getPageMedia = function getPageMedia(options) {
  const self = this;

  return self.getPageEntry(options)
    .then((page) => {
      const requestOptions = self.extractRequestParams(options);
      delete requestOptions.baseUrl;
      requestOptions.uri = page.content.replace(self.baseUrl, '').replace('oauth', 'basic');
      return promiseReturn(self, 'makeRequest', requestOptions, responseParser.mediaParser);
    });
};

IbmConnectionsWikisService.prototype.getVersionMedia = function getVersionMedia(options) {
  const self = this;

  return self.getPageVersion(options)
    .then((pageVersion) => {
      const requestOptions = self.extractRequestParams(options);
      delete requestOptions.baseUrl;
      requestOptions.uri = pageVersion.content.replace(self.baseUrl, '').replace('oauth', 'basic');
      return promiseReturn(self, 'makeRequest', requestOptions, responseParser.mediaParser);
    });
};

module.exports = IbmConnectionsWikisService;
