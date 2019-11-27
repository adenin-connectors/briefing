'use strict';

module.exports = async (activity) => {
  try {
    if (!Array.isArray(activity.Request.Data)) {
      activity.Response.ErrorCode = 400;
      activity.Response.Data = {
        ErrorText: `Expected data to be an Array, got ${typeof activity.Request.Data}`
      };

      return;
    }

    if (activity.Request.Data.length === 0) {
      activity.Response.ErrorCode = 400;
      activity.Response.Data = {
        ErrorText: 'Request data array was empty'
      };

      return;
    }

    const entity = activity.Request.Data[0].payload;

    entity._type = 'ticket';

    if (typeof entity.id !== 'string') entity.id = entity.id.toString();

    // build description based on what API provided
    let description = '';

    if (entity.contact.firstName) description += entity.contact.firstName;
    if (entity.contact.lastName) description += description ? ` ${entity.contact.lastName}` : entity.contact.lastName;
    if (entity.contact.account) description += description ? ` from ${entity.contact.account.accountName}` : entity.contact.account.accountName;

    entity.openvalue = false;

    if (entity.status) {
      description += description ? ` - ${entity.status}` : entity.status;

      if (entity.status.toLowerCase() === 'open') entity.openvalue = true;
    }

    entity.description = description;
    entity.title = entity.subject;
    entity.date = entity.createdTime;
    entity.link = entity.webUrl;

    const collections = [];

    // Initialise assignees and roles (Zoho will not send roles)
    entity.assignedto = [];
    entity.roles = [];

    // If we have an assignee email, add to assignedTo
    if (entity.assignee && entity.assignee.email) entity.assignedto.push(entity.assignee.email);

    // case 1: A collection "all" is returned with users and roles
    collections.push({
      name: 'all',
      users: entity.assignedto,
      roles: entity.roles,
      date: entity.date
    });

    if (entity.openvalue) {
      // case 2: When open == true we return collection “open”, with users and roles
      collections.push({
        name: 'open',
        users: entity.assignedto,
        roles: entity.roles,
        date: entity.date
      });

      // case 3: When assignedTo is not empty and open we return a collection “my”, with only users: assignedto
      // if assignedTo is empty we use roles instead
      if (entity.assignedto.length > 0) {
        collections.push({
          name: 'my',
          users: entity.assignedto,
          roles: [],
          date: entity.date
        });
      } else {
        collections.push({
          name: 'my',
          users: [],
          roles: entity.roles,
          date: entity.date
        });
      }

      if (entity.dueDate) {
        const dueDate = new Date(entity.dueDate).toISOString();

        // case 4: When DueDate is provided and open we return a collection “due”, with users and roles; date = dueDate
        collections.push({
          name: 'due',
          users: entity.assignedto,
          roles: entity.roles,
          date: dueDate
        });

        // case 5: When DueDate is provided and open we return a collection “my-due”, with only users: assignedto, date = dueDate
        // if assignedTo is empty we use roles
        if (entity.assignedto.length > 1) {
          collections.push({
            name: 'my-due',
            users: entity.assignedto,
            roles: [],
            date: dueDate
          });
        } else {
          collections.push({
            name: 'my-due',
            users: [],
            roles: entity.roles,
            date: dueDate
          });
        }
      }
    }

    activity.Response.Data = {
      entity: entity,
      collections: collections
    };
  } catch (error) {
    $.handleError(activity, error);
  }
};
