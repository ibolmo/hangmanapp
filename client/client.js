function my_turn(){
  return game().active == Meteor.userId();
}

Template.announcement.announcements = function(){
  return Notifications.find({user_id: Meteor.userId()});
};

Template.announcement.rendered = function(){
  $(this.find('.alert')).delay(2000).fadeOut(500, function(){
    Meteor.call('clearNotifications');
  });
};

Template.announcement.events({
  'click button': function(){
    Meteor.call('clearNotifications');
  }
});

Template.hangman.wrong = function(){
  return game().faults;
};

Template.hud.show = function(){
  return !!Meteor.user();
};

Template.hud.points = function(){
  var player = Meteor.user();
  return player.profile.points || 0;
};

Template.hud.timeLeft = function(){
  return game().clock;
};

Template.hud.status = function(){
  if (my_turn()) return 'Your turn.';
  if (game().master == Meteor.userId()) return 'Prepare the game.';
  return 'Waiting for your turn.';
};

Template.input.show = function(){
  return my_turn();
};

Template.input.preserve(['input']);

Template.input.events({

 'keyup': function(){
    var input = $('#input input');
    Meteor.call('guess', input.val());
    input.val('');
 }

});

Template.fields.placeholders = function(){
  return game().placeholders;
};

Template.hint.hint = function(){
  return game().hint;
};

Template.login.show = function(){
  return !!Meteor.user();
};

Meteor.setInterval(function () {
  Meteor.call('keepalive', Meteor.userId());
}, 5000);
