game = function(){
  return Games.findOne() || console.error('No game initialized.');
};

Games = new Meteor.Collection('games');

Notifications = new Meteor.Collection('notifications');
