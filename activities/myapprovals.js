'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);

    const pagination = $.pagination(activity);
    const dateRange = $.dateRange(activity);
    const response = await api(`/approval/my?page=${pagination.page}&pageSize=${pagination.pageSize}` +
      `&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);

    if ($.isErrorResponse(activity, response)) return;

    activity.Response.Data.items = response.body.Data.items;
    let value = response.body.Data.count;
    activity.Response.Data.title = T(activity, 'My Approvals');
    activity.Response.Data.link = "";
    activity.Response.Data.linkLabel = T(activity, 'All Approvals');
    activity.Response.Data.actionable = value > 0;

    if (value > 0) {
      activity.Response.Data.value = value;
      activity.Response.Data.color = 'blue';
      activity.Response.Data.description = value > 1 ? T(activity, "You have {0} approvals.", value)
        : T(activity, "You have 1 approval.");
    } else {
      activity.Response.Data.description = T(activity, `You have no approvals.`);
    }
  } catch (error) {
    $.handleError(activity, error);
  }
};