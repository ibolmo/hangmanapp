Meteor.subscribe('games');
Meteor.subscribe('notifications');

function my_turn(){
  return game().active == Meteor.userId();
}

function im_master(){
  return game().master == Meteor.userId();
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

Template.hangman.show = function(){
  return game();
};

Template.hangman.wrong = function(){
  return game().faults;
};

Template.hud.show = function(){
  return game() && !!Meteor.user();
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
  if (im_master()) return game().ready ? 'Prepare the game.' : 'Waiting for round to end.';
  return 'Waiting for your turn.';
};

Template.prepare.show = function(){
  return game() && im_master();
};

Template.prepare.events({

  'keyup input': function(e){
    $(e.target).val(trim_except_space($(e.target).val()));
    $(e.target).parent('.form-group').removeClass('has-error');
  },

  'submit': function(e){
    e.preventDefault();
    $('#prepare .help-block').text('');
    var solution = $('#solution'), hint = $('#hint');
    var result = Meteor.call('prepare_game', solution.val(), hint.val(), function(code, errors){
      if (errors.solution || errors.hint){
        if (errors.solution) solution.parent('.form-group').addClass('has-error').children('.help-block').text(errors.solution);
        if (errors.hint) hint.parent('.form-group').addClass('has-error').children('.help-block').text(errors.hint);
      }
    });
  }

});

Template.input.show = function(){
  return game() && my_turn();
};

Template.input.preserve(['input']);

Template.input.events({

 'keyup': function(){
    var input = $('#input input');
    Meteor.call('guess', input.val());
    input.val('');
 }

});

Template.fields.show = function(){
  return game();
};

Template.fields.placeholders = function(){
  return game().placeholders;
};

Template.hint.show = function(){
  return game().hint;
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
