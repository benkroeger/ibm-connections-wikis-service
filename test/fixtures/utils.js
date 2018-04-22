// node core modules

// 3rd party modules
const _ = require('lodash');

// internal modules
const serviceFactory = require('../../lib');

const { unmocked, username, password } = process.env;

const init = () => {
  const serviceOptions = {
    defaults: {
      authType: 'basic',
    },
    requestPhases: ['initial', 'format-url-template', 'final'],

  };
  if (unmocked) {
    Object.assign(serviceOptions.defaults, {
      auth: {
        user: username,
        pass: password,
      },
    });
  }

  const service = serviceFactory('https://apps.na.collabserv.com/wikis/', serviceOptions);

  const baseMembers = ['id', 'versionLabel', 'title', 'published', 'updated', 'created',
    'content', 'links', 'author', 'modified',
  ];

  const wikiPageMembers = [...baseMembers, 'label', 'summary', 'visibility', 'versionUuid',
    'propagation', 'totalMediaSize', 'ranks',
  ];
  const wikiVersionPageMembers = [...baseMembers, 'label', 'summary', 'documentUuid', 'libraryId'];
  const wikiCommentsMembers = [...baseMembers, 'language', 'deleteWithRecord'];
  const wikiVersionsMembers = [...baseMembers, 'label', 'summary', 'libraryId', 'documentUuid'];

  return {
    service,
    serviceOptions,
    wikiPageMembers,
    wikiVersionPageMembers,
    wikiCommentsMembers,
    wikiVersionsMembers,
  };
};

const initContext = t => _.assign(t.context, init());

module.exports = initContext;
