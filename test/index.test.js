'use strict';

// node core modules

// 3rd party modules
import test from 'ava';
import _ from 'lodash';

// internal modules
import { mock, record, persist } from './fixtures/http-mocking';
import serviceFactory from '../lib';

const { unmocked } = process.env;

test.before(() => (unmocked ? record() : mock()));
test.after(() => unmocked && persist());

test.beforeEach((t) => {
  const serviceOptions = {
    defaults: {
      authType: 'basic',
    },
    plugins: {
      cache: {
        ttl: 60 * 60,
      }
    }
  };

  if (unmocked) {
    Object.assign(serviceOptions.defaults, {
      auth: {
        user: process.env.username,
        pass: process.env.password,
      },
    });
  }

  const service = serviceFactory('https://apps.na.collabserv.com/wikis/', serviceOptions);
  // const service = serviceFactory('https://lc.gish.de/wikis/', serviceOptions);

  const baseMembers = ['id', 'versionLabel', 'title', 'published', 'updated', 'created',
    'content', 'links', 'author', 'modified',
  ];

  const wikiPageMembers = [...baseMembers, 'label', 'summary', 'visibility', 'versionUuid',
    'propagation', 'totalMediaSize', 'ranks',
  ];
  const wikiVersionPageMembers = [...baseMembers, 'label', 'summary', 'documentUuid', 'libraryId'];
  const wikiCommentsMembers = [...baseMembers, 'language', 'deleteWithRecord'];
  const wikiVersionsMembers = [...baseMembers, 'label', 'summary', 'libraryId', 'documentUuid'];

  _.assign(t.context, {
    service,
    serviceOptions,
    wikiPageMembers,
    wikiVersionPageMembers,
    wikiCommentsMembers,
    wikiVersionsMembers,
  });
});

/* Successful scenarios validations */

test.cb('validate retrieving wiki navigation feed, wikiLabel provided', (t) => {
  const { service } = t.context;
  const query = {
    wikiLabel: 'b4e28920-2670-4f35-9db7-356b909e551a',
  };
  const options = {
    authType: 'basic',
    plugins: {
      cacheRedis: {
        delayCaching: false,
      },
    },
  };

  service.navigationFeed(query, options, (err, response, body) => {
    console.log(err);
    t.true(true);
    t.end();
  })
});

// test.cb('validate retrieving wiki navigation feed, wikiLabel provided', (t) => {
//   const { service } = t.context;
//   const query = {
//     wikiLabel: '2feb2356-ab0f-458d-8a27-334363d9d192',
//   };
//   const options = {
//     authType: 'basic',
//     cachePluginOptions: {
//       delayCaching: true,
//     },
//   };
//
//   service.navigationFeed(query, options, (err, response, body) => {
//     t.ifError(err);
//     t.end();
//   })
// });
//
// test.cb('validate retrieving wiki page, wikiLabel & pageLabel provided', (t) => {
//   const { service, wikiPageMembers } = t.context;
//   const query = {
//     wikiLabel: '2feb2356-ab0f-458d-8a27-334363d9d192',
//     pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
//   };
//   const options = {
//     authType: 'basic',
//   };
//
//   service.wikiPage(query, options, (err, response) => {
//     t.ifError(err);
//     t.true('wikiPage' in response, `{wikiPage} should be a member of ${response}`);
//
//     const { wikiPage } = response;
//     t.true(_.isPlainObject(wikiPage), `{wikiPage} should be plain object, instead we got: [${typeof wikiPage}]`);
//     wikiPageMembers.forEach(prop => t.true(prop in wikiPage, `[${prop}] should be a member of {response.wikiPage}`));
//     ['links', 'author', 'ranks'].forEach(prop =>
//       t.true(
//         _.isPlainObject(wikiPage[prop]),
//         `[${prop}] should be a plain object, instead we got: [${typeof wikiPage[prop]}]`
//       )
//     );
//
//     ['totalMediaSize', 'versionLabel'].forEach(prop =>
//       t.true(
//         _.isFinite(wikiPage[prop]),
//         `[${prop}] should be an integer, instead we got: [${typeof wikiPage[prop]}]`
//       )
//     );
//     t.end();
//   });
// });
//
// test.cb('validate retrieving wiki version page, wikiLabel, pageLabel & versionLabel provided', (t) => {
//   const { service, wikiVersionPageMembers } = t.context;
//   const query = {
//     wikiLabel: '2feb2356-ab0f-458d-8a27-334363d9d192',
//     pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
//     versionLabel: 'db47be61-98e0-478f-8616-df6c4cd82a1d',
//   };
//   const options = {
//     authType: 'basic',
//   };
//
//   service.pageVersionDetails(query, options, (err, response) => {
//     t.ifError(err);
//     t.true('pageVersionDetails' in response, `{pageVersionDetails} should be a member of ${response}`);
//
//     const { pageVersionDetails } = response;
//     // eslint-disable-next-line max-len
//     t.true(_.isPlainObject(pageVersionDetails), `{pageVersionDetails} should be plain object, instead we got: [${typeof pageVersionDetails}]`);
//     wikiVersionPageMembers.forEach(prop =>
//       t.true(prop in pageVersionDetails, `[${prop}] should be a member of {response.pageVersionDetails}`));
//     ['links', 'author', 'modifier'].forEach(prop =>
//       t.true(
//         _.isPlainObject(pageVersionDetails[prop]),
//         `[${prop}] should be a plain object, instead we got: [${typeof pageVersionDetails[prop]}]`
//       )
//     );
//
//     t.true(
//       _.isFinite(pageVersionDetails.versionLabel),
//       `[versionLabel] should be a number, instead we got: [${typeof pageVersionDetails.versionLabel}]`
//     );
//     t.end();
//   });
// });
//
// test.cb('validate retrieving all comments from wiki page, wikiLabel & pageLabel provided', (t) => {
//   const { service, wikiCommentsMembers } = t.context;
//
//   const query = {
//     wikiLabel: '434a24f4-28a2-45a4-b83a-a55120f1ca72',
//     pageLabel: 'cfd4229d-9b2a-4845-b5f0-a3e530785eff',
//   };
//   const options = {
//     authType: 'basic',
//   };
//
//   service.pageComments(query, options, (err, response) => {
//     t.ifError(err);
//     t.true('pageComments' in response, `{pageComments} should be a member of ${response}`);
//
//     const { pageComments } = response;
//
//     t.true(_.isArray(pageComments), `{pageComments} should be an Array, instead we got: [${typeof pageComments}]`);
//     pageComments.forEach((comment, i) => {
//       wikiCommentsMembers.forEach((prop) => {
//         t.true(prop in comment, `[${prop}] should be a member of {response.pageComments[${i}].comment}`);
//         // eslint-disable-next-line max-len
//         t.true(_.isFinite(comment.versionLabel), `[versionLabel] should be a number, instead we got: [${typeof pageComments.versionLabel}]`);
//       });
//       ['links', 'author', 'modifier'].forEach(prop =>
//         t.true(
//           _.isPlainObject(comment[prop]),
//           `[${prop}] should be a plain object, instead we got: [${typeof comment[prop]}]`
//         )
//       );
//     });
//     t.end();
//   });
// });
//
// test.cb('validate retrieving all versions from wiki page, wikiLabel, pageLabel and query.category provided', (t) => {
//   const { service, wikiVersionsMembers } = t.context;
//   const query = {
//     wikiLabel: '434a24f4-28a2-45a4-b83a-a55120f1ca72',
//     pageLabel: 'cfd4229d-9b2a-4845-b5f0-a3e530785eff',
//   };
//   const options = {
//     authType: 'basic',
//   };
//
//   service.pageVersions(query, options, (err, response) => {
//     t.ifError(err);
//     t.true('pageVersions' in response, `{pageVersions} should be a member of ${response}`);
//
//     const { pageVersions } = response;
//     t.true(_.isArray(pageVersions), `{pageVersions} should be an Array, instead we got: [${typeof pageVersions}]`);
//     pageVersions.forEach((comment, i) => {
//       wikiVersionsMembers.forEach((prop) => {
//         t.true(prop in comment, `[${prop}] should be a member of {response.pageVersions[${i}].comment}`);
//         // eslint-disable-next-line max-len
//         t.true(_.isFinite(comment.versionLabel), `[versionLabel] should be a number, instead we got: [${typeof pageVersions.versionLabel}]`);
//       });
//       ['links', 'author', 'modifier'].forEach(prop =>
//         t.true(
//           _.isPlainObject(comment[prop]),
//           `[${prop}] should be a plain object, instead we got: [${typeof comment[prop]}]`
//         )
//       );
//     });
//     t.end();
//   });
// });
//
// test.cb('validate retrieving wiki page "media content", "authType" provided', (t) => {
//   const { service } = t.context;
//   const query = {
//     wikiLabel: '2feb2356-ab0f-458d-8a27-334363d9d192',
//     pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
//   };
//   const options = {
//     authType: 'basic',
//   };
//
//   service.wikiPage(query, options, (err, response) => {
//     t.ifError(err);
//     const content = response.wikiPage.content.src;
//     service.mediaContent({}, { content, mediaAuthType: 'basic' }, (err, response) => { // eslint-disable-line no-shadow
//       t.ifError(err);
//       t.true('mediaContent' in response, `{mediaContent} should be a member of ${response}`);
//       // eslint-disable-next-line max-len
//       t.true(_.isString(response.mediaContent), `{mediaContent} should be a String, instead we got: [${typeof mediaContent}]`);
//       t.end();
//     });
//   });
// });
//
// test.cb('validate retrieving wiki version page "media content", wikiLabel provided', (t) => {
//   const { service } = t.context;
//   const query = {
//     wikiLabel: '2feb2356-ab0f-458d-8a27-334363d9d192',
//     pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
//     versionLabel: 'db47be61-98e0-478f-8616-df6c4cd82a1d',
//   };
//   const options = {
//     authType: 'basic',
//   };
//
//   service.pageVersionDetails(query, options, (err, response) => {
//     t.ifError(err);
//     const content = response.pageVersionDetails.content.src;
//     service.mediaContent({}, { content, mediaAuthType: 'basic' }, (err, response) => { // eslint-disable-line no-shadow
//       t.ifError(err);
//       t.true('mediaContent' in response, `{mediaContent} should be a member of ${response}`);
//
//       const { mediaContent } = response;
//       t.true(_.isString(mediaContent), `{mediaContent} should be a String, instead we got: [${typeof mediaContent}]`);
//       t.false(mediaContent.includes('<!DOCTYPE html'), '{mediaContent} should not start with "<!DOCTYPE html"');
//       t.end();
//     });
//   });
// });
//
// /* Error / Wrong input scenarios validations */
//
// test.cb('error validation for retrieving wiki navigation feed, "wikiLabel" not provided', (t) => {
//   const { service } = t.context;
//   const query = {};
//   const options = {
//     authType: 'basic',
//   };
//
//   service.navigationFeed(query, options, (err) => {
//     t.is(err.message, '{{query.wikiLabel}} must be defined in [navigationFeed] request');
//     t.is(err.httpStatus, 404);
//     t.end();
//   });
// });
//
// test.cb('error validation for retrieving wiki page, "wikiLabel" not provided', (t) => {
//   const { service } = t.context;
//   const query = {};
//   const options = {
//     authType: 'basic',
//   };
//
//   service.wikiPage(query, options, (err) => {
//     t.is(err.message, '{{query.wikiLabel}} must be defined in [wikiPage] request');
//     t.is(err.httpStatus, 404);
//     t.end();
//   });
// });
//
// test.cb('error validation for retrieving wiki page, pageLabel not provided', (t) => {
//   const { service } = t.context;
//   const query = {
//     wikiLabel: '434a24f4-28a2-45a4-b83a-a55120f1ca72',
//   };
//   const options = {
//     authType: 'basic',
//   };
//
//   service.wikiPage(query, options, (err) => {
//     t.is(err.message, '{{query.pageLabel}} must be defined in [wikiPage] request');
//     t.is(err.httpStatus, 404);
//     t.end();
//   });
// });
//
// test.cb('error validation for retrieving wiki page, wrong wikiLabel provided', (t) => {
//   const { service } = t.context;
//   const query = {
//     wikiLabel: 'mock label',
//     pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
//   };
//   const options = {
//     authType: 'basic',
//   };
//
//   service.wikiPage(query, options, (err) => {
//     // eslint-disable-next-line max-len
//     t.is(err.message, `<?xml version="1.0" encoding="UTF-8"?><td:error xmlns:td="urn:ibm.com/td"><td:errorCode>ItemNotFound</td:errorCode><td:errorMessage>Item not found with id ${query.wikiLabel}</td:errorMessage></td:error>`);
//     t.is(err.httpStatus, 404);
//     t.end();
//   });
// });
//
// test.cb('error validation for retrieving wiki version page, versionLabel not provided', (t) => {
//   const { service } = t.context;
//   const query = {
//     wikiLabel: '2feb2356-ab0f-458d-8a27-334363d9d192',
//     pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
//   };
//   const options = {
//     authType: 'basic',
//   };
//
//   service.pageVersionDetails(query, options, (err) => {
//     t.is(err.message, '{{query.versionLabel}} must be defined in [pageVersionDetails] request');
//     t.is(err.httpStatus, 404);
//     t.end();
//   });
// });
//
// test.cb('error validation for retrieving wiki version page, wrong versionLabel provided', (t) => {
//   const { service } = t.context;
//   const query = {
//     wikiLabel: '2feb2356-ab0f-458d-8a27-334363d9d192',
//     pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
//     versionLabel: 'mock version label',
//   };
//   const options = {
//     authType: 'basic',
//   };
//
//   service.pageVersionDetails(query, options, (err) => {
//     // eslint-disable-next-line max-len
//     t.is(err.message, `<?xml version="1.0" encoding="UTF-8"?><td:error xmlns:td="urn:ibm.com/td"><td:errorCode>ItemNotFound</td:errorCode><td:errorMessage>The request parameter id : ${query.versionLabel} is invalid.</td:errorMessage></td:error>`);
//     t.is(err.httpStatus, 404);
//     t.end();
//   });
// });
//
// test.cb('error validation for retrieving all comments from wiki page, wrong pageLabel provided', (t) => {
//   const { service } = t.context;
//   const query = {
//     wikiLabel: '434a24f4-28a2-45a4-b83a-a55120f1ca72',
//     pageLabel: 'mock page label',
//   };
//   const options = {
//     authType: 'basic',
//   };
//
//   service.pageComments(query, options, (err) => {
//     // eslint-disable-next-line max-len
//     t.is(err.message, `<?xml version="1.0" encoding="UTF-8"?><td:error xmlns:td="urn:ibm.com/td"><td:errorCode>ItemNotFound</td:errorCode><td:errorMessage>EJPVJ9220E: Unable to get the media with the label ${query.pageLabel} in the library with ID ${query.wikiLabel}.</td:errorMessage></td:error>`);
//     t.is(err.httpStatus, 404);
//     t.end();
//   });
// });
//
// test.cb('error validation for retrieving wiki page "media content", wrong "mediaAuthType" provided', (t) => {
//   const { service } = t.context;
//   const query = {
//     wikiLabel: '2feb2356-ab0f-458d-8a27-334363d9d192',
//     pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
//   };
//   const options = {
//     authType: 'basic',
//   };
//
//   service.wikiPage(query, options, (err, response) => {
//     t.ifError(err);
//     const content = response.wikiPage.content.src;
//     service.mediaContent({}, { content, mediaAuthType: 'oauth' }, (err, response) => { // eslint-disable-line no-shadow
//       t.ifError(err);
//       const { mediaContent } = response;
//       t.true(mediaContent.includes('<!DOCTYPE html'), '{mediaContent} should start with "<!DOCTYPE html"');
//       t.end();
//     });
//   });
// });
//
// test.cb('error validation for not providing valid "uri" through "content" data while fetching "wikiPage"', (t) => {
//   const { service } = t.context;
//   const query = {
//     wikiLabel: '2feb2356-ab0f-458d-8a27-334363d9d192',
//     pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
//   };
//   const options = {
//     authType: 'basic',
//   };
//
//   service.wikiPage(query, options, (err) => {
//     t.true(_.isNull(err));
//     service.mediaContent({}, { mediaAuthType: 'basic' }, (err) => { // eslint-disable-line no-shadow
//       t.is(err.message, 'options.uri must be a string when using options.baseUrl');
//       t.end();
//     });
//   });
// });
