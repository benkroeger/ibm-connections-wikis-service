'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');
const debug = require('debug')('ibm-connections:wikis:handle-multiple-request');

// internal modules

const buildListOfPromises = (listOfStubIds, fn) => listOfStubIds.map(id => fn(id));

/**
 * Method that processes navigation feed items. It supports any number of wiki pages.
 * The purpose of this method is to prepare navigation items for building full navigation tree by
 * making sure that all "stub" items are parsed (if there are any)
 *
 * @param {Object} navigationFeed                   Object that holds information about navigation structure.
 * @param {Object} requestOptions                   Query object
 * @param {Function} filterNavigationFeedById       Function that builds a Promise, and it is responsible
 *                                                  for initiating a request to wiki service.
 * @param {Function} callback                       Method response
 */
const processNavigationFeed = (navigationFeed, requestOptions = {}, filterNavigationFeedById, callback) => {
  const { items } = navigationFeed;
  const { qs: { pageLabel } } = requestOptions;
  // keep a reference list of items that are of type "stub".
  // When item is of this type, it means that it's children will not be displayed in response,
  // and so we need to make additional request for every item of this type.
  const listOfStubIds = [];

  const validItems = _.reduce(items, (result, item) => {
    const { type, id } = item;
    if (type === 'stub') {
      listOfStubIds.push(id);
      return result;
    }
    result.push(item);
    return result;
  }, []);

  // if this list is empty, it means that we do not need to make additional requests,
  // and that we have enough information to build a full navigation tree.
  if (listOfStubIds.length === 0) {
    callback(null, validItems);
    return;
  }

  /**
   * Method that parses an Array of provided "stub" items, by using Promises to fetch the
   * data of each item asynchronously, and recursion, since each item might potentially have multiple
   * "stub" items as children.
   *
   * @param {Array} currentStubItems    An Array of ID's which are used for building an Array of Promises,
   *                                    which are resolved by using Promise.all() method.
   * @return {Promise.<TResult>}        It returns a promise. Since Promise can be chained/piped, it is a
   *                                    perfect candidate when we need to mix recursion and asynchronous calls.
   */
  const parseStubItems = (currentStubItems) => {
    // with each recursive call, start with an empty array of next "stub" items.
    const nextStubItems = [];

    return Promise.all(buildListOfPromises(currentStubItems, filterNavigationFeedById))
      .then((allPromisedItems) => {
        const filteredItems = _.flatten(allPromisedItems)
          .filter((subItem) => {
            if (subItem.type === 'stub') {
              nextStubItems.push(subItem.id);
              return false;
            }
            return true;
          });

        // if we have no more "stub" items, then combine current filtered items
        // with already compiled valid items.
        if (nextStubItems.length === 0) {
          return filteredItems.concat(validItems);
        }

        // otherwise, make a call with new "stub" items,
        // and wait for a Promise to return.
        return parseStubItems(nextStubItems)
          .then(listOfParsedStubItems => filteredItems.concat(listOfParsedStubItems))
          .catch((err) => { throw err; });
      })
      // if we get an error along the way, make sure to throw it, so that
      // next "catch" method in he pipeline can actually catch it.
      .catch((err) => { throw err; });
  };

  // if we got pageLabel and listOfStubIds is not empty, it means that we have to process navigation feed items
  // by making additional requests on pageLabel item and (potentially) on his children.
  if (pageLabel) {
    parseStubItems([pageLabel])
      .then(subItemsList => callback(null, subItemsList))
      .catch((stubItemListError) => {
        // if pageLabel was not provided, then we need to process all stub ID's
        // This way, we match the same loading behavior as with low-number of wiki pages
        if (stubItemListError && stubItemListError.message.includes('Invalid UUID string')) {
          parseStubItems(listOfStubIds)
            .then(completeItemsList => callback(null, completeItemsList))
            .catch(err => callback(err));
          return;
        }
        callback(stubItemListError);
      });
    return;
  }

  // if pageLabel was not provided, then we need to process all stub ID's
  parseStubItems(listOfStubIds)
    .then(completeItemsList => callback(null, completeItemsList))
    .catch(err => callback(err));
};

const loadWikiNavigationFeed = ({
  httpClient,
  requestOptions,
  response: originalResponse,
  body: navigationFeed,
  callback,
}) => {
  /**
   * Method that initiates a service request, and resolves/rejects a filtered response.
   *
   * @param {String} id      A value that is used as "parent" query parameter.
   */
  const filterNavigationFeedById = id =>
    new Promise((resolve, reject) => {
      const additionalRequestOptions = _.defaultsDeep({
        qs: {
          parent: id,
        },
        phasesToSkip: {
          requestPhases: ['cache'],
          responsePhases: ['cache'],
        },
      }, requestOptions);

      httpClient.makeRequest(additionalRequestOptions, (err, response, body = {}) => {
        if (err) {
          reject(err);
          return;
        }
        const {  items = [] } = body;
        const reducedItems = items.reduce((result, item) => {
          // response items may have other other items that are not related to provided parentID.
          // we need to filter out only the children of requested parent, as well as parent item itself.
          // Previously, parent item was of type "stub" and had no Array of children references.
          // This one does.
          if (item.id === id || item.parent === id) {
            result.push(item);
          }
          return result;
        }, []);

        resolve(reducedItems);
      });
    });

    processNavigationFeed(navigationFeed, requestOptions, filterNavigationFeedById, (navItemsError, validNavItems) => {
      if (navItemsError) {
        callback(navItemsError);
        return;
      }
      // make sure to cache the response items before returning
      originalResponse.emit('addToCache', validNavItems);

      callback(null, { validNavItems});
    });
};

module.exports = loadWikiNavigationFeed;
