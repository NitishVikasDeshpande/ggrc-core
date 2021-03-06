/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import '../components/info-pin-buttons/info-pin-buttons';
import '../components/questions-link/questions-link';
import '../components/info-pane/info-pane-footer';
import '../components/assessment/info-pane/info-pane';
import '../components/folder-attachments-list/folder-attachments-list';
import '../components/unmap-button/unmap-person-button';
import '../components/issue-tracker/info-issue-tracker-fields';
import '../components/comment/comment-data-provider';
import '../components/comment/comment-add-form';
import '../components/comment/mapped-comments';
import '../components/object-list-item/document-object-list-item';
import '../components/object-list-item/editable-document-object-list-item';
import '../components/show-related-assessments-button/show-related-assessments-button';
import '../components/proposal/create-proposal-button';
import '../components/related-objects/proposals/related-proposals';
import '../components/related-objects/proposals/related-proposals-item';
import '../components/related-objects/revisions/related-revisions';
import '../components/snapshotter/revisions-comparer';
import '../components/snapshotter/snapshot-comparer-config';
import '../components/revision-history/restore-revision';
import '../components/unarchive_link';
import '../components/sort/sort-by';
import * as TreeViewUtils from '../plugins/utils/tree-view-utils';
import {confirm} from '../plugins/utils/modals';
import {
  getInstanceView
} from '../plugins/utils/object-history-utils';

export const pinContentHiddenClass = 'pin-content--hidden';
export const pinContentMaximizedClass = 'pin-content--maximized';
export const pinContentMinimizedClass = 'pin-content--minimized';

export default can.Control({
  pluginName: 'cms_controllers_info_pin',
  defaults: {
    view: GGRC.mustache_path + '/base_objects/info.mustache'
  }
}, {
  init: function (el, options) {
    this.unsetInstance();
  },
  isPinVisible() {
    return !this.element.hasClass(pinContentHiddenClass);
  },
  findOptions: function (el) {
    var options;
    var treeNode = el.closest('.cms_controllers_tree_view_node');

    if (treeNode.length) {
      options = treeNode.control().options;
    } else {
      options = el.closest('.tree-item-element').viewModel();
    }
    return options;
  },
  hideInstance: function () {
    this.unsetInstance();
    $(window).trigger('resize');
  },
  unsetInstance: function () {
    this.element
      .addClass(pinContentHiddenClass)
      .removeClass(`${pinContentMaximizedClass} ${pinContentMinimizedClass}`)
      .html('');
  },
  setHtml: function (opts, view, confirmEdit, options, maximizedState) {
    var instance = opts.attr('instance');
    var parentInstance = opts.attr('parent_instance');
    var self = this;
    import(/* webpackChunkName: "modalsCtrls" */'./modals')
      .then(() => {
        this.element.html(can.view(view, {
          instance: instance,
          isSnapshot: !!instance.snapshot || instance.isRevision,
          parentInstance: parentInstance,
          model: instance.class,
          confirmEdit: confirmEdit,
          is_info_pin: true,
          options: options,
          result: options.result,
          page_instance: GGRC.page_instance(),
          maximized: maximizedState,
          onChangeMaximizedState: function () {
            return self.changeMaximizedState.bind(self);
          },
          onClose: function () {
            return self.close.bind(self);
          }
        }));
      });
  },
  prepareView: function (opts, el, maximizedState) {
    var instance = opts.attr('instance');
    var options = this.findOptions(el);
    var populatedOpts = opts.attr('options');
    var confirmEdit = instance.class.confirmEditModal || {};
    var view = getInstanceView(instance);

    if (populatedOpts && !options.attr('result')) {
      options = populatedOpts;
    }

    if (!_.isEmpty(confirmEdit)) {
      confirmEdit.confirm = this.confirmEdit;
    }

    this.setHtml(opts, view, confirmEdit, options, maximizedState);
  },
  setInstance: function (opts, el, maximizedState) {
    var instance = opts.attr('instance');
    var infoPaneOpenDfd = can.Deferred();
    var isSubtreeItem = opts.attr('options.isSubTreeItem');

    opts.attr('options.isDirectlyRelated',
      !isSubtreeItem ||
      TreeViewUtils.isDirectlyRelated(instance));

    this.prepareView(opts, el, maximizedState);

    if (instance.info_pane_preload) {
      instance.info_pane_preload();
    }

    this.showInstance(maximizedState);

    // Temporary solution...
    setTimeout(infoPaneOpenDfd.resolve, 1000);

    return infoPaneOpenDfd;
  },
  showInstance(maximizedState) {
    this.element
      .removeClass(`${pinContentMaximizedClass} ${pinContentMinimizedClass}`)
      .removeClass(pinContentHiddenClass);

    if (maximizedState) {
      this.element.addClass(pinContentMaximizedClass);
    }
    else {
      this.element.addClass(pinContentMinimizedClass);
    }
  },
  updateInstance: function (selector, instance) {
    var vm = this.element.find(selector).viewModel();

    vm.attr('instance', instance);
    vm.attr('instance').dispatch({
      type: 'update'
    });
  },
  setLoadingIndicator: function (selector, isLoading) {
    this.element.toggleClass('loading');

    this.element.find(selector)
      .viewModel()
      .attr('isLoading', isLoading);
  },
  confirmEdit: function (instance, modalDetails) {
    var confirmDfd = $.Deferred();
    var renderer = can.view.mustache(modalDetails.description);
    confirm({
      modal_description: renderer(instance).textContent,
      modal_confirm: modalDetails.button,
      modal_title: modalDetails.title,
      button_view: GGRC.mustache_path + '/quick_form/confirm_buttons.mustache'
    }, confirmDfd.resolve);
    return confirmDfd;
  },
  changeMaximizedState: function (maximizedState) {
    this.showInstance(maximizedState);

    var $activeTree = $('.cms_controllers_tree_view_node.active');
    if (maximizedState) {
      $activeTree
        .addClass('maximized-info-pane');
    } else {
      $activeTree
        .removeClass('maximized-info-pane');
    }
  },
  close: function () {
    var visibleWidget = $('.widget-area .widget:visible');
    var element = visibleWidget.find('.cms_controllers_tree_view');

    if (element.length) {
      element.control().deselect();
    } else {
      visibleWidget.find('.item-active')
        .removeClass('item-active');
    }

    this.unsetInstance();
  },
  /**
   * Checks if there are modals on top of the info pane.
   * @return {boolean} - true if there are modals on top of the info pane else
   *  false.
   */
  existModals() {
    return (
      $('.modal:visible').length > 0 ||
      $('[role=dialog]:visible').length > 0
    );
  },
  /**
   * Checks if $target is an element wherein shouldn't be closed the info pane
   * with help the escape key.
   * @param {jQuery} $target - an jQuery element.
   * @return {boolean} - true if the escape key shouldn't be processed
   *  otherwise false.
   */
  isEscapeKeyException($target) {
    const insideInfoPane = $target.closest('.pin-content').length > 0;
    const excludeForEscapeKey = ['button', '[role=button]', '.btn', 'input',
      'textarea'];
    const isExcludingControl = _.any(excludeForEscapeKey, (typeName) =>
      $target.is(typeName)
    );
    return (
      insideInfoPane &&
      (
        isExcludingControl ||
        $target.attr('contentEditable') === 'true'
      )
    );
  },
  ' scroll': function (el, ev) {
    var header = this.element.find('.pane-header');
    var isFixed = el.scrollTop() > 0;

    header.toggleClass('pane-header__fixed', isFixed);
  },
  '{window} keyup'(el, event) {
    const ESCAPE_KEY_CODE = 27;
    const $target = $(event.target);
    const escapeKeyWasPressed = event.keyCode === ESCAPE_KEY_CODE;

    const close = (
      escapeKeyWasPressed &&
      this.isPinVisible() &&
      !this.existModals() &&
      !this.isEscapeKeyException($target)
    );

    if (close) {
      this.close();
      event.stopPropagation();
    }
  },
});
