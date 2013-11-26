game = function(){
  return Games.findOne();
};

trim_all = function(string){
	return string.replace(/[^a-zA-Z]/g, "");
};

trim_except_space = function(string){
	return string.replace(/[^a-zA-Z ]/g, "");
};


Games = new Meteor.Collection('games');

Notifications = new Meteor.Collection('notifications');
