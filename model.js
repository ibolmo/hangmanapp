/*

Models
-------

Game: {
	players: [Meteor.user],
	master: Meteor.user,
	active: Meteor.user,
	guessed: [String],
	solution: String,
	placeholders: [String],
	hint: String,
	clock: 120
}

*/

game = function(){
  return Games.findOne() || console.error('No game initialized.');
};

Games = new Meteor.Collection('games');
