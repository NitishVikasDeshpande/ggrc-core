/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

(function (can, GGRC, CMS) {
  'use strict';
  /**
   * A "mixin" denoting a model type that can be assigned custom roles.
   *
   * It inherits from Cacheable model, because it needs get_binding() to
   * correctly display AccessControlRole instances as children in tree views.
   *
   * This "mixin" is thus applied to models in a slightly different way - a
   * model needs to have a static property named `isRoleable` set to true.
   *
   * @class
   */
  can.Model.Cacheable('CMS.Models.Roleable', {
    findAll: function () {
      // We do not query the backend, this implementation is used to diplay
      // a list of objects in the Custom Roles widget.
      let types = _.sortByOrder(GGRC.roleableTypes, 'category', false);

      let instances = can.map(types, function (type, i) {
        let withId = can.extend(type, {id: i});
        return new CMS.Models.Roleable(withId);
      });

      return can.when(instances);
    },
  }, {
    // Cacheable checks if selfLink is set when the findAll deferred is done
    selfLink: '/custom_roles_list',  // TODO: what path here?
  });

  /**
   * A model representing an AccessControl role deifnition.
   *
   * @class
   */
  can.Model.Cacheable('CMS.Models.AccessControlRole', {
    root_object: 'access_control_role',
    root_collection: 'access_control_roles',
    category: 'access_control_roles',
    findAll: 'GET /api/access_control_roles',
    findOne: 'GET /api/access_control_roles/{id}',
    create: 'POST /api/access_control_roles',
    update: 'PUT /api/access_control_roles/{id}',
    destroy: 'DELETE /api/access_control_roles/{id}',
    mixins: [],
    attributes: {},
    defaults: {
      read: true,
      update: true,
      delete: true,
    },
    links_to: {},
    init: function () {
      this.validateNonBlank('name');
      this._super.apply(this, arguments);
    },
  }, {
    init: function () {
      this._super.apply(this, arguments);
    },
  });
})(window.can, window.GGRC, window.CMS);
