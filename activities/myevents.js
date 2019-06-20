'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);

    const pagination = $.pagination(activity);
    const dateRange = $.dateRange(activity, 'today');
    const response = await api(`/event/my?page=${pagination.page}&pageSize=${pagination.pageSize}` +
      `&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);

    if ($.isErrorResponse(activity, response)) return;

    activity.Response.Data.items = response.body.Data.items;
    if (parseInt(pagination.page) == 1) {
      let value = response.body.Data.count;
      activity.Response.Data.title = T(activity, 'My Events');
      activity.Response.Data.link = "";
      activity.Response.Data.linkLabel = T(activity, 'All Events');
      activity.Response.Data.actionable = value > 0;

      if (value > 0) {
        let nextEvent = api.getNexEvent(response.body.Data.items);

        let eventFormatedTime = api.getEventFormatedTimeAsString(activity, nextEvent);
        let eventPluralorNot = value > 1 ? T(activity, "events scheduled") : T(activity, "event scheduled");
        let description = T(activity, `You have {0} {1} today. The next event '{2}' starts {3}`, value, eventPluralorNot, nextEvent.title, eventFormatedTime);

        activity.Response.Data.value = value;
        activity.Response.Data.date = activity.Response.Data.items[0].date;
        activity.Response.Data.color = 'blue';
        activity.Response.Data.description = description;
      } else {
        activity.Response.Data.description = T(activity, `You have no events today.`);
      }
    }
  } catch (error) {
    $.handleError(activity, error);
  }
};