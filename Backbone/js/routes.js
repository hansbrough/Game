HG.Router = Backbone.Router.extend({

  routes: {
    "": "home",
	  "setup": "setup",
	  "pick": "pick",
    "roll-for-resources": "resources",
    "trade": "trade",
	  "play-event": "playEvent",
	  "house-turn": "houseTurn"
  },

  home: function() {
    //APP.appView.home();
	  console.log('home');
  },

  resources: function() {
    //APP.appView.newNote();
	  console.log('roll-for-resources');
  },

  setup: function() {
    //APP.appView.editNote( id );
	  console.log('setup');
  },

  pick: function() {
    //APP.appView.editNote( id );
	  console.log('pick');
  },

  trade: function() {
    //APP.appView.editNote( id );
	console.log('trade');
  },

  'playEvent': function() {
    //APP.appView.editNote( id );
	console.log('play-event');
  },

  'houseTurn': function() {
    //APP.appView.editNote( id );
	console.log('house-turn');
  },



});

HG.router = new HG.Router();
Backbone.history.start();