import Ember from 'ember';

const { $ } = Ember;

export default {
  name: 'preview-revisions',

  initialize: function() {
    const regex = new RegExp('(#/)?(index.html:\.*?(?=/|$))', 'i');
    const locationPartToTest = location.hash ? location.hash : location.pathname;

    var result = regex.exec(locationPartToTest);

    if (result) {
      var baseHref = result[2];

      $('base').attr('href', `/${baseHref}/`);
    }
  }
};
