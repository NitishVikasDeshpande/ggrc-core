/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import template from './add-tab-button.mustache';
import Permission from '../../permission';

const viewModel = can.Map.extend({
  define: {
    isAuditInaccessibleAssessment: {
      get() {
        let audit = this.attr('instance.audit');
        let type = this.attr('instance.type');
        let result = (type === 'Assessment') &&
          !!audit &&
          !Permission.is_allowed_for('read', audit);
        return result;
      },
    },
  },
  instance: null,
  widgetList: null,
  urlPath: '',
  addTabTitle: '',
  isNotObjectVersion(internavDisplay) {
    return internavDisplay.indexOf('Versions') === -1;
  },
  isNotProhibitedMap(shortName) {
    const prohibitedMapList = {
      Issue: ['Assessment', 'Audit'],
    };

    const instanceType = this.attr('instance.type');

    return prohibitedMapList[instanceType] &&
      prohibitedMapList[instanceType].includes(shortName);
  },
});

GGRC.Components('addTabButton', {
  tag: 'add-tab-button',
  template,
  viewModel,
  helpers: {
    filterWidgets(widget, options) {
      if (this.isNotObjectVersion(widget.internav_display) &&
      !this.isNotProhibitedMap(widget.model.shortName) &&
      widget.attr('placeInAddTab')) {
        return options.fn(options.contexts);
      }

      return options.inverse(options.contexts);
    },
    shouldCreateObject(instance, modelShortName, options) {
      if (modelShortName() === 'Audit' &&
        instance().type === 'Program') {
        return options.fn(options.contexts);
      }

      return options.inverse(options.contexts);
    },
  },
});
