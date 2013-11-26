Meteor.publish('games', function(){
	return Games.find({}, {
		fields: {
			active: 1,
			master: 1,
			faults: 1,
			clock: 1,
			ready: 1,
			placeholders: 1,
			waiting: 1,
			hint: 1
		}
	});
});

Meteor.publish('notifications', function(){
	return Notifications.find({user_id: this.userId});
});

var CLOCK_TIMEOUT = 9;
var WAIT_MAX = 4 * CLOCK_TIMEOUT;

Meteor.startup(function(){
	if (!game()) initialize();
	Meteor.setInterval(tick, 1000);
});

function initialize(master){
	if (game()) Games.remove(game()._id);

	Games.insert({
		master: master && master._id,
		active: null,
		guessed: [],
		faults: 0,
		status: 'Preparing the game.',
		solution: '',
		ready: false,
		placeholders: [],
		hint: '',
		clock: CLOCK_TIMEOUT,
		waiting: 0
	});
}

function tick(){
	if (!game()) initialize();
	check_master();
	if (game().ready) check_active();
	check_clock();

  Games.update(game()._id, {'$inc': {clock: -1}});
}

function pick_master_from_active(){
	initialize(get_random_active_user());
}

function check_master(){
	if (!game().master){
		pick_master_from_active();
	} else if (!game().ready)  {
		Games.update(game()._id, {'$inc': {waiting: 1}});
		if (game().waiting >= WAIT_MAX){
			notify(game().master, 'danger', "You didn't set the solution/hint in time.");
			pick_master_from_active();
		}
	}
}

function check_active(){
	var active = game().active;
	if (!active){
		active = get_random_active_user();
		if (active) Games.update(game()._id, {'$set': {active: active._id}});
	}
}

function get_random_active_user() {
	var recent = {'profile.last_seen': {'$gt': Date.now() - 10000}, '_id': {'$ne': game().master}};
	var count = Meteor.users.find(recent).count();
	return Meteor.users.findOne(recent, {skip: _.random(0, count - 1)})
}

function check_clock(){
	if (game().clock <= 0){
		reset_clock();
		next_opponent();
	}
}

function create_placeholders(solution){
	return solution.split(' ').map(function(part){
		return part.split('').map(function(character){
			return {
				character: character,
				answered: false
			}
		});
	});
}

function reset_clock() {
	Games.update(game()._id, {'$set': {clock: CLOCK_TIMEOUT}});
}

function lose_game(userId){
	check(userId, String);
	notify(userId, 'danger', 'You lost.');
	Meteor.setTimeout(initialize, 2000);
}

function notify(userId, type, message){
	Notifications.insert({user_id: userId, type: type, message: message});
}

function win_game(userId) {
	check(userId, String);
	notify(userId, 'success', 'You win!');
	Meteor.users.update({_id: userId}, {'$inc': {'profile.points': 10}});
	Meteor.setTimeout(initialize, 2000);
}

function next_opponent(){
	Games.update(game()._id, {'$set': {active: ''}});
}

Meteor.methods({

  keepalive: function (user_id){
  	check(user_id, String);
    if (Meteor.users.findOne(user_id)){
			Meteor.users.update(user_id, {$set: {'profile.last_seen': Date.now()}});
    }
  },

  guess: function(letter){
  	check(letter, String);

  	letter = trim_all(letter).toLowerCase();
  	if (!letter) return;

  	if (_.contains(game().guessed, letter)){
  		return notify(this.userId, 'info', 'You already tried that letter.');
  	}

		Games.update(game()._id, {'$push': {guessed: letter}});

  	if (solution_has_letter(letter)){
  		var placeholders = update_placeholders_and_score_for_user_id(letter, this.userId);
  		if (solved(placeholders)) return win_game(this.userId);
  	} else {
  		Games.update(game()._id, {'$inc': {faults: 1}});
  		if (game().faults == 9) return lose_game(this.userId);
  	}

  	reset_clock();
  },

  clearNotifications: function(){
  	Notifications.remove({user_id: this.userId});
  },

  prepare_game: function(solution, hint){
  	var errors = {};
  	solution = trim_except_space(solution), hint = trim_except_space(hint);
  	check(solution, String);
  	check(hint, String);
  	if (!solution) errors.solution = 'Missing';
  	if (!hint) errors.hint = 'Missing';
  	if (solution.length > 'rio grande valley'.length) errors.solution = 'Too long.';
  	if (hint.length > 'rio grande valley'.length) errors.hint = 'Too long.';

  	if (!errors.solution  && !errors.hint){
			Games.update(game()._id, {
				'$set': {
					status: 'Starting game.',
					solution: solution,
					ready: true,
					hint: hint,
					waiting: 0,
					placeholders: create_placeholders(solution),
					clock: CLOCK_TIMEOUT
				}
			});
  	}

		return errors;
  },

  getActiveUsersCount: function(){
  	return Meteor.users.find({'profile.last_seen': {'$gt': Date.now() - 10000}}).count();
  }
});

function update_placeholders_and_score_for_user_id(letter, userId){
	var placeholders = game().placeholders.map(function(word){
		return word.map(function(character){
			if (character.character.toLowerCase() == letter){
				character.answered = true;
				Meteor.users.update({_id: userId}, {'$inc': {'profile.points': 1}});
			}
			return character;
		});
	});
  Games.update(game()._id, {'$set': {placeholders: placeholders}});
  return placeholders;
}

function solution_has_letter(letter){
	return new RegExp(letter, 'i').test(game().solution);
}

function solved(placeholders) {
	return placeholders.every(function(words){
		return words.every(function(letter){
			return letter.answered;
		});
	});
}
