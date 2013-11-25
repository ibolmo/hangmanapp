var DEFAULTS = [
	{solution: 'Tech Tuesdays', hint: 'event'},
	{solution: 'Rio Grande Valley', hint: 'location'},
	{solution: 'UTPA', hint: 'school'},
	{solution: 'Last Tuesday', hint: 'day'}
];

var CLOCK_TIMEOUT = 9;

Meteor.startup(function(){
	if (!game()) initialize();
	Meteor.setInterval(tick, 1000);
});

function initialize(){
	if (game()) Games.remove(game()._id);

	var starting = _.shuffle(DEFAULTS)[0];
	Games.insert({
		master: null,
		active: null,
		guessed: [],
		faults: 0,
		solution: starting.solution,
		placeholders: create_placeholders(starting.solution),
		hint: starting.hint,
		clock: CLOCK_TIMEOUT
	});
}

function tick(){
	check_master();
	check_active();
	check_clock();

	Games.update(game()._id, {'$inc': {clock: -1}});
}

function check_master(){
	return game().master;
}

function check_active(){
	var active = game().active;
	if (!active){
		var recent = {last_seen: {$gt: Date.now() - 10000}};
		var count = Meteor.users.find(recent).count();
		active = Meteor.users.findOne(recent, {skip: _.random(0, count - 1)});
		if (active) Games.update(game()._id, {'$set': {active: active._id}});
	}
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

function lose_game(){
	console.log('lost');
	initialize();
}

function win_game() {
	console.log('won');
	initialize();
}

function next_opponent(){
	Games.update(game()._id, {'$set': {active: ''}});
}

Meteor.methods({
  keepalive: function (user_id){
  	check(user_id, String);
    if (Meteor.users.findOne(user_id)){
			Meteor.users.update(user_id, {$set: {last_seen: Date.now()}});
    }
  },

  guess: function(letter){
  	check(letter, String);

  	letter = trim(letter).toLowerCase();
  	if (!letter) return;

  	if (_.contains(game().guessed, letter)){
  		Session.set('notice', 'You already tried that letter.');
  	}

		Games.update(game()._id, {'$push': {guessed: letter}});

  	if (solution_has_letter(letter)){
  		var placeholders = game().placeholders.map(function(word){
  			return word.map(function(character){
  				if (character.character.toLowerCase() == letter) character.answered = true;
  				return character;
  			});
  		});
  		Games.update(game()._id, {'$set': {placeholders: placeholders}});
  		if (solved(placeholders)) return win_game();
  	} else {
  		if (game().faults == 9) return lose_game();
  		Games.update(game()._id, {'$inc': {faults: 1}});
  	}

  	reset_clock();
  }
});

function trim(letter){
	return letter.replace(/[^a-zA-Z]/g, "");
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
