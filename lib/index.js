'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');
const OniyiHttpClient = require('oniyi-http-client');
const credentialsPlugin = require('oniyi-http-plugin-credentials');
const formatUrlTemplatePlugin = require('oniyi-http-plugin-format-url-template');
const cachePlugin = require('oniyi-http-plugin-cache-redis');

// internal modules
const methods = require('./methods');

/**
 * The factory function exported by the ibm-connections-wikis module which returns an instance of the [IbmConnectionsWikisService].
 *
 * @param   {String} baseUrl                                   The base URL of the IBM Connections Cloud instance with which the service will be communicating.
 * @param   {Object} serviceOptions                            An object of key-value pairs to set as defaults for the service.
 * @param   {String} [serviceOptions.accessToken]              An OAuth access token for the IBM Connections Cloud instance with which the service will be communicating.
 *                                                             If you provide this, it will be provided as a bearer token in the Authorization header on every request you
 *                                                             make with the service.
 * @param   {Object} [serviceOptions.headers]                  An object of key-value pairs, where a key is a HTTP header name and the corresponding value is the value for
 *                                                             the HTTP header. These headers and their values will be attached to every request the service makes.
 */
module.exports = (baseUrl, serviceOptions = {}) => {
  // params we'll use across the module
  const params = _.merge(
    {
      defaults: {
        authType: '',
        baseUrl: baseUrl.charAt(baseUrl.length - 1) === '/' ? baseUrl : `${baseUrl}/`,
      },
      requestPhases: [],
      responsePhases: [],
    },
    serviceOptions
  );

  // create a http client to be used throughout this service
  const httpClient = OniyiHttpClient.create(params);
  const { plugins = {} } = params;

  if (plugins.credentials) {
    httpClient.use(credentialsPlugin(plugins.credentials));
  }

  if (plugins.cache) {
    httpClient.use(cachePlugin(plugins.cache));
  }

  const formatUrlTemplateOptions = _.merge({
    valuesMap: {
      authType: {
        saml: '',
        cookie: '',
      },
    },
  }, plugins.formatUrlTemplate || {});

  httpClient.use(formatUrlTemplatePlugin(formatUrlTemplateOptions));

  const service = {};

  Object.defineProperty(service, 'httpClient', { value: httpClient });
  Object.defineProperty(service, 'params', { value: params });

  Object.assign(service, methods);

  return service;
};
