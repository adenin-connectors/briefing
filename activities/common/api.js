'use strict';

const got = require('got');
const HttpAgent = require('agentkeepalive');
const moment = require('moment-timezone');
const HttpsAgent = HttpAgent.HttpsAgent;

let _activity = null;

function api(path, opts) {
  if (typeof path !== 'string') {
    return Promise.reject(new TypeError(`Expected \`path\` to be a string, got ${typeof path}`));
  }

  opts = Object.assign({
    json: true,
    token: _activity.Context.connector.token,
    endpoint: _activity.Context.connector.custom1,
    agent: {
      http: new HttpAgent(),
      https: new HttpsAgent()
    }
  }, opts);

  opts.headers = Object.assign({
    "Content-Type": 'application/json',
    "X-UserName": _activity.Context.UserName,
    "X-UserEmail": _activity.Context.UserEmail,
    "X-ClusterKey": process.env.CLUSTER_KEY || _activity.Context.connector.apikey,
    accept: 'application/json',
    'user-agent': 'adenin Digital Assistant Connector, https://www.adenin.com/digital-assistant'
  }, opts.headers);

  if (opts.token) opts.headers.Authorization = `Bearer ${opts.token}`;

  const url = /^http(s)\:\/\/?/.test(path) && opts.endpoint ? path : opts.endpoint + path;

  if (opts.stream) return got.stream(url, opts);

  return got(url, opts).catch((err) => {
    throw err;
  });
}

const helpers = [
  'get',
  'post',
  'put',
  'patch',
  'head',
  'delete'
];

api.initialize = (activity) => {
  _activity = activity;
};

api.stream = (url, opts) => got(url, Object.assign({}, opts, {
  json: false,
  stream: true
}));

for (const x of helpers) {
  const method = x.toUpperCase();
  api[x] = (url, opts) => api(url, Object.assign({}, opts, { method }));
  api.stream[x] = (url, opts) => api.stream(url, Object.assign({}, opts, { method }));
}

/**filters out first upcoming event */
api.getNexEvent = function (events) {
  let nextEvent = null;
  let nextEventMilis = 0;

  for (let i = 0; i < events.length; i++) {
    let tempDate = Date.parse(events[i].date);

    if (nextEventMilis == 0) {
      nextEventMilis = tempDate;
      nextEvent = events[i];
    }

    if (nextEventMilis > tempDate) {
      nextEventMilis = tempDate;
      nextEvent = events[i];
    }
  }

  return nextEvent;
}

//** checks if event is in less then hour, today or tomorrow and returns formated string accordingly */
api.getEventFormatedTimeAsString = function(activity, nextEvent) {
  let eventTime = moment(nextEvent.date)
    .tz(activity.Context.UserTimezone)
    .locale(activity.Context.UserLocale);
  let timeNow = moment(new Date());

  let diffInHrs = eventTime.diff(timeNow, 'hours');

  if (diffInHrs == 0) {
    //events that start in less then 1 hour
    let diffInMins = eventTime.diff(timeNow, 'minutes');
    return T(activity, `in {0} minutes.`, diffInMins);
  } else {
    //events that start in more than 1 hour
    let diffInDays = eventTime.diff(timeNow, 'days');

    let datePrefix = '';
    let momentDate = '';
    if (diffInDays == 1) {
      //events that start tomorrow
      datePrefix = 'tomorrow ';
    } else if (diffInDays > 1) {
      //events that start day after tomorrow and later
      datePrefix = 'on ';
      momentDate = eventTime.format('LL') + " ";
    }

    return T(activity, `{0}{1}{2}{3}.`, T(activity, datePrefix), momentDate, T(activity, "at "), eventTime.format('LT'));
  }
}

module.exports = api;
