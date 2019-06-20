'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);

    const pagination = $.pagination(activity);
    const dateRange = $.dateRange(activity);
    const response = await api(`/issue/all?page=${pagination.page}&pageSize=${pagination.pageSize}` +
      `&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);

    if ($.isErrorResponse(activity, response)) return;

    activity.Response.Data.items = response.body.Data.items;
    if (parseInt(pagination.page) == 1) {
      let value = response.body.Data.count;
      activity.Response.Data.title = T(activity, 'All Issues');
      activity.Response.Data.link = "";
      activity.Response.Data.linkLabel = T(activity, 'All Issues');
      activity.Response.Data.actionable = value > 0;

      if (value > 0) {
        activity.Response.Data.value = value;
        activity.Response.Data.date = activity.Response.Data.items[0].date;
        activity.Response.Data.color = 'blue';
        activity.Response.Data.description = value > 1 ? T(activity, "There are {0} issues.", value)
          : T(activity, "There is 1 issue.");
      } else {
        activity.Response.Data.description = T(activity, 'There are no issues.');
      }
    }
  } catch (error) {
    $.handleError(activity, error);
  }
};