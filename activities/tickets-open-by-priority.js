'use strict';

const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);

    const response = await api('/ticket/all');

    if ($.isErrorResponse(activity, response)) return;

    let items = response.body.Data.items;

    if (!items) items = [];

    const priorities = [];
    const datasets = [];
    const data = [];

    for (let i = 0; i < items.length; i++) {
      const priority = items[i].priority ? items[i].priority : 'No Priority';

      if (!priorities.includes(priority)) priorities.push(priority);
    }

    for (let x = 0; x < priorities.length; x++) {
      let counter = 0;

      for (let y = 0; y < items.length; y++) {
        const status = items[y].priority ? items[y].priority : 'No Priority';

        if (priorities[x] === status) counter++;
      }

      data.push(counter);
    }

    datasets.push({
      label: 'Number Of Tickets',
      data
    });

    const chart = {
      configuration: {
        data: {
          labels: priorities,
          datasets: datasets
        },
        options: {
          title: {
            display: true,
            text: 'Open Tickets by Priority'
          }
        }
      },
      template: 'pie-labels'
    };

    activity.Response.Data.chart = chart;
    activity.Response.Data.title = T(activity, 'Open Tickets by Priority');
  } catch (error) {
    $.handleError(activity, error);
  }
};
