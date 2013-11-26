Meteor.subscribe('games');
Meteor.subscribe('notifications');

Meteor.setInterval(updateCount, 5000);
Meteor.startup(function(){
  updateCount();
});

function my_turn(){
  return game().active == Meteor.userId();
}

function im_master(){
  return game().master == Meteor.userId();
}

function updateCount() {
  Meteor.call('getActiveUsersCount', function(error, result){
    $('#count').text(result);
  });
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

Template.hud.imMasterAndWaiting = function(){
  return im_master() && game().waiting;
};

Template.hud.timeLeft = function(){
  return game().clock;
};

Template.hud.status = function(){
  if (my_turn()) return 'Your turn.';
  if (im_master()) return game().ready ? 'Waiting for round to end.' : 'Prepare the game.';
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

Template.analytics.created = function(){
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-45986467-1', 'meteor.com');
  ga('send', 'pageview');
};

Meteor.setInterval(function () {
  Meteor.call('keepalive', Meteor.userId());
}, 5000);
