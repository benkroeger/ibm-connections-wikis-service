'use strict';

// node core modules

// 3rd party modules

// internal modules

const handleSingleRequest = (response, body, isStorable, callback) => {
  if (isStorable) {
    response.emit('addToCache', body);
  }

  callback(null, { navigationFeed: body });
};

module.exports = handleSingleRequest;
