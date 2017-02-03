'use strict';
// node core modules

// 3rd party modules
const DomParser = require('xmldom').DOMParser;
const XMLSerializer = require('xmldom').XMLSerializer;
const select = require('xpath.js');

// internal modules

const xml = {};
const parser = new DomParser();
const serializer = new XMLSerializer();

function getQueryObject(queryString) {
  if (typeof queryString !== 'string') {
    return false;
  }

  const sep = queryString.split('[');
  const paths = sep[0].split(':');
  const query = {};
  const attributes = [];

  switch (paths.length) {
    case 3:
      query.ns = paths[0];
      query.tag = paths[1];
      query.special = paths[2];
      break;
    case 2:
      if (['first-child'].indexOf(paths[paths.length - 1]) > -1) {
        query.tag = paths[0];
        query.special = paths[1];
      } else {
        query.ns = paths[0];
        query.tag = paths[1];
      }
      break;
    case 1:
      query.tag = paths[0];
      break;
    default:
      return false;
  }

  if (typeof sep[1] === 'string') {
    sep[1].replace(/[\[\]]/g, '').split(',').forEach((ele) => {
      const element = ele.split('=');
      const attribute = {
        name: element[0],
      };
      if (typeof element[1] === 'string') {
        attribute.value = element[1].replace(/["']/g, '');
      }
      attributes.push(attribute);
    });
    query.attr = attributes;
  }

  return query;
}

xml.parse = function parse(xmlString) {
  let xmlDoc = false;
  try {
    xmlDoc = parser.parseFromString(xmlString, 'text/xhtml');
  } catch (e) {} // eslint-disable-line no-empty
  return xmlDoc;
};

xml.serialize = function serialize(xmlDoc) {
  let str = '';
  try {
    str = serializer.serializeToString(xmlDoc);
  } catch (e) {} // eslint-disable-line no-empty
  return str;
};

xml.find = function find(xmlDoc, pathString) {
  if (typeof xmlDoc === 'string') {
    xmlDoc = xml.parseToDoc(xmlDoc); // eslint-disable-line no-param-reassign
  }

  if (typeof pathString !== 'string') {
    return false;
  }
  const pathArray = pathString.split(' ');
  let resultsArray = [xmlDoc];
  // nameSpace:tagName:special[attr1="val1",attr2="val2"]

  pathArray.forEach((queryString) => {
    const query = getQueryObject(queryString);
    const results = [];
    if (typeof query.ns === 'string') {
      // @TDOD: implement namespace support; this esp. requires mapping from xmlns abbr to uri
      return;
    }
    if (typeof query.special === 'string') {
      // @TDOD: implement special locators such as "first-child"
      return;
    }
    if (typeof query.tag === 'string') {
      resultsArray.forEach((ele) => {
        Array.prototype.forEach.call(ele.getElementsByTagName(query.tag), (result) => {
          let failedAttrs = 0;
          if (query.attr) {
            failedAttrs = query.attr.length;
            query.attr.forEach((attribute) => {
              if (result.hasAttribute(attribute.name)) {
                if ((typeof attribute.value === 'string') && (result.getAttribute(attribute.name) === attribute.value)) { // eslint-disable-line max-len
                  failedAttrs -= 1;
                } else if (typeof attribute.value !== 'string') {
                  failedAttrs -= 1;
                }
              }
            });
          }
          if (failedAttrs === 0) {
            results.push(result);
          }
        });
      });
    }
    resultsArray = results;
  });
  return resultsArray;
};

xml.select = select;

module.exports = xml;
