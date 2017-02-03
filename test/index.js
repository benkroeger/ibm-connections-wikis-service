'use strict';
// node core modules

// 3rd party modules
import test from 'ava';
import _ from 'lodash';

// internal modules
const IbmConnectionsWikisService = require('../');

let wikiService;

test.beforeEach((t) => {
  const auth = `Basic ${new Buffer('ajevtic@ztech.io:guitar91').toString('base64')}`;
  const requestOptions = {
    headers: {
      Authorization: auth,
    },
  };
  wikiService = new IbmConnectionsWikisService('https://greenhouse.lotus.com', { requestOptions });
  t.not(wikiService, undefined, 'wikiService should defined');
});
test.afterEach((t) => {
  wikiService = {};
  t.true(_.isPlainObject(wikiService), 'resetting service');
});

test('validate result for retrieving a feed of a person\'s wiki', (t) => {
  const options = {
    method: 'GET',
  };
  return wikiService.getWikisFeed(options)
    .then((result) => {
      result = result[0]; // eslint-disable-line no-param-reassign
      // make sure we have necessary elements in our promise response
      const params = ['id', 'title'];
      params.forEach((elem) => {
        t.true(elem in result, `${elem} should be a member of {{ result }}`);
        t.not(elem, undefined, `${elem} should not be undefined`);
      });
    });
});

test('validate result for retrieving a feed of a wiki pages', (t) => {
  const options = {
    method: 'GET',
    wikiLabel: 'aa545daa-512e-42f2-8307-7e3821c14cf8',
  };
  return wikiService.getPagesFeed(options)
    .then((result) => {
      result = result[0]; // eslint-disable-line no-param-reassign
      // make sure we have necessary elements in our promise response
      const params = ['id', 'title'];
      params.forEach((elem) => {
        t.true(elem in result, `${elem} should be a member of {{ result }}`);
        t.not(elem, undefined, `${elem} should not be undefined`);
      });
    });
});

test('validate result for retrieving entry of wiki page, wikiLabel: provided, pageLabel: provided', (t) => {
  const options = {
    method: 'GET',
    wikiLabel: '2e9f5515-a44d-49e2-9049-3d0a337720ee',
    pageLabel: '3331c115-cba7-4ad6-8288-2f2006b03db0',
  };
  return wikiService.getPageEntry(options)
    .then((result) => {
      // make sure we have necessary elements in our promise response
      const params = ['id', 'title', 'content', 'links', 'author', 'updatedAt'];
      params.forEach((elem) => {
        t.true(elem in result, `${elem} should be a member of {{ result }}`);
      });

      const { links, author } = result;
      // make sure we have necessary elements in our promise response.links
      const linkParams = ['self', 'edit', 'editMedia', 'enclosure', 'related', 'replies'];
      linkParams.forEach((elem) => {
        t.true(elem in links, `${elem} should be a member of {{ result.links }}`);
      });
      ['id', 'displayName'].forEach((elem) => {
        t.true(elem in author, `${elem} should be a member of {{ result.author }}`);
      });
    });
});

test('validate result for retrieving all comments from wiki page, wikiLabel: provided, pageLabel: provided', (t) => {
  const options = {
    method: 'GET',
    wikiLabel: '38e06c6d-4ea1-4972-9ee6-6f4fd748437a',
    pageLabel: '269642e3-69ff-47ee-813d-db328c9ffcbf',
  };
  return wikiService.getPageArtifacts(options)
    .then((result) => {
      result = result[0]; // eslint-disable-line no-param-reassign
      // make sure we have necessary elements in our promise response
      const params = ['id', 'content', 'author', 'updatedAt'];
      params.forEach((elem) => {
        t.true(elem in result, `${elem} should be a member of {{ result }}`);
      });
      const { author } = result;
      ['id', 'displayName'].forEach((elem) => {
        t.true(elem in author, `${elem} should be a member of {{ result.author }}`);
      });
    });
});

test('validate result for retrieving all versions from wiki page, wikiLabel, pageLabel and category provided', (t) => {
  const options = {
    method: 'GET',
    wikiLabel: '38e06c6d-4ea1-4972-9ee6-6f4fd748437a',
    pageLabel: '269642e3-69ff-47ee-813d-db328c9ffcbf',
    category: 'version',
  };
  return wikiService.getPageArtifacts(options)
    .then((result) => {
      const params = ['id', 'number', 'links', 'author', 'updatedAt'];
      params.forEach((elem) => {
        t.true(elem in result, `${elem} should be a member of {{ result }}`);
      });

      const { links, author } = result;
      // make sure we have necessary elements in our promise response.links
      const linkParams = ['self', 'alternate', 'edit', 'editMedia', 'enclosure'];
      linkParams.forEach((elem) => {
        t.true(elem in links, `${elem} should be a member of {{ result.links }}`);
      });
      ['id', 'displayName'].forEach((elem) => {
        t.true(elem in author, `${elem} should be a member of {{ result.author }}`);
      });
    });
});

test('validate result for retrieving version from wiki page, wikiLabel, pageLabel and category provided', (t) => {
  const options = {
    method: 'GET',
    wikiLabel: '2e9f5515-a44d-49e2-9049-3d0a337720ee',
    pageLabel: '3331c115-cba7-4ad6-8288-2f2006b03db0',
    versionLabel: '98651e0c-b28b-4ad1-8dc1-727083e5df64',
  };
  return wikiService.getPageVersion(options)
    .then((result) => {
      const params = ['id', 'title', 'content', 'links', 'author', 'updatedAt'];
      params.forEach((elem) => {
        t.true(elem in result, `${elem} should be a member of {{ result }}`);
      });
      const { links, author } = result;
      // make sure we have necessary elements in our promise response.links
      const linkParams = ['self', 'alternate', 'edit', 'editMedia', 'enclosure'];
      linkParams.forEach((elem) => {
        t.true(elem in links, `${elem} should be a member of {{ result.links }}`);
      });
      ['id', 'displayName'].forEach((elem) => {
        t.true(elem in author, `${elem} should be a member of {{ result.author }}`);
      });
    });
});

test('validate result for page media ', (t) => {
  const options = {
    method: 'GET',
    wikiLabel: '2e9f5515-a44d-49e2-9049-3d0a337720ee',
    pageLabel: 'acdedb8d-b5ce-499b-ad10-9aa3efaec3ad',
  };
  return wikiService.getPageMedia(options)
    .then((result) => {
      t.true(_.isString(result), 'result should be of type string (Html doc)');
    });
});

test('validate result for version media ', (t) => {
  const options = {
    method: 'GET',
    wikiLabel: '2e9f5515-a44d-49e2-9049-3d0a337720ee',
    pageLabel: '3331c115-cba7-4ad6-8288-2f2006b03db0',
    versionLabel: '98651e0c-b28b-4ad1-8dc1-727083e5df64',
  };
  return wikiService.getVersionMedia(options)
    .then((result) => {
      t.true(_.isString(result), 'result should be of type string (Html doc)');
    });
});
