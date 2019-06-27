'use strict';
module.exports = async (activity) => {
  try {
    // ensure that request is not case sensitive
    const rawEntity = activity.Request.Query;
    let keys = Object.keys(rawEntity);
    let entity = {};
    for (let i = 0; i < keys.length; i++) {
      entity[keys[i].toLowerCase()] = rawEntity[keys[i]];
    }

    // check if apikey is valid
    if (!activity.Context.connector.custom2 || (activity.Context.connector.custom2 != entity.apikey)) {
      activity.Response.ErrorCode = 403;
      activity.Response.Data = {
        ErrorText: "invalid APIKEY"
      };
      return;
    }

    // remove apikey from object so we don't store it in database
    delete entity.apikey;

    // make sure id is provided
    if (!entity.id) {
      activity.Response.ErrorCode = 400;
      activity.Response.Data = {
        ErrorText: "no id was provided"
      };
      return;
    }

    // makes sure id is string
    if (typeof entity.id !== 'string') {
      entity.id = entity.id.toString();
    }

    // make sure entity type is provided
    if (!entity._type) {
      activity.Response.ErrorCode = 400;
      activity.Response.Data = {
        ErrorText: "no entity type was provided"
      };
      return;
    }

    // make sure title is provided
    if (!entity.title) {
      activity.Response.ErrorCode = 400;
      activity.Response.Data = {
        ErrorText: "no title was provided"
      };
      return;
    }

    // check if date is provided and if valid date
    if (!entity.date) {
      entity.date = new Date().toISOString(); // if no date is provided we fallback to "now"
    } else {
      if (isNaN(Date.parse(entity.date))) entity.date = new Date().toISOString(); // checks if date is valid, if not we fallback to "now"
    }

    let collections = [];

    let date = new Date(entity.date).toISOString();

    if (!entity.assignedto) {
      entity.assignedto = []; // if there is no assignedto object create empty to avoid errors later
    } else {
      // split assignees separated with "," into string []
      entity.assignedto = entity.assignedto.split(',');
    }

    if (!entity.roles) {
      entity.roles = []; // if there is no roles object create empty to avoid errors later
    } else {
      // split roles separated with "," into string []
      entity.roles = entity.roles.split(',');
    }

    // handle openvalue field if provided and evaluate it
    if(entity.openvalue) entity.openvalue = doEval(entity.openvalue);


    if (entity.assignedto.length > 0 || entity.roles.length > 0) {
      // case 1: A collection "all" is returned with users and roles
      collections.push({ name: "all", users: entity.assignedto, roles: entity.roles, date: date });

      if (entity.openvalue === undefined || entity.openvalue === true) {

        // case 2: When open == true we return collection “open”, with users and roles
        collections.push({ name: "open", users: entity.assignedto, roles: entity.roles, date: date });

        // case 3: When AssignedTo is not empty and open we return a collection “my”, with only users: assignedto
        // if assignedto is empty we use roles instead
        if (entity.assignedto.length > 0) {
          collections.push({ name: "my", users: entity.assignedto, roles: [], date: date });
        } else {
          collections.push({ name: "my", users: [], roles: entity.roles, date: date });
        }

        if (entity.dueDate) {
          let dueDate = new Date(entity.dueDate).toISOString();

          // case 4: When DueDate is provided and open we return a collection “due”, with users and roles; date = DueDate
          collections.push({ name: "due", users: entity.assignedto, roles: entity.roles, date: dueDate });

          // case 5: When DueDate is provided and open we return a collection “my-due”, with only users: assignedto, date = DueDate
          // if assignedto is empty we use roles
          if (entity.assignedto.length > 1) {
            collections.push({ name: "my-due", users: entity.assignedto, roles: [], date: dueDate });
          } else {
            collections.push({ name: "my-due", users: [], roles: entity.roles, date: dueDate });
          }
        }
      }
    }

    activity.Response.Data = { entity: entity, collections: collections };
  } catch (error) {
    $.handleError(activity, error);
  }

  // evaluates string as boolean value
  function doEval(expression) {
    try {
      return eval(expression);
    } catch (error) {
      $.handleError(activity, error);
    }
    return true;
  }
};

