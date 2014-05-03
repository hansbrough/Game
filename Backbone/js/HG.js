/* Logic for the History Game using Backbone Library. 
-- Serves as mediator, namespace and proxies calls between components
-- no business logic
*/

//Note: perhaps HG and the Game component are really the same thing and should be combined ... ?
//console.log('HG file loaded')
// create namespace for the HistoryGame app
// add an event aggregator
var HG = {
	$el:null,
	models:{},
	component:{},
	loaded: {
		GameView:false,
		BalanceBoards:false,
		Events:false,
		Players:false,
		PlayersView:false,
		Characters:false,
		Resources:false,
		CharactersView:false,
		ResourcesView:false,
		EventsView:false,
		InfluenceCards:false,
		InfluenceCardsView:false,
		WildCards:false,
		WildCardsView:false,
		Tradeables:false,
		TradeablesView:false,
		Messages:false,
		MessagesView:false
	},
	init: {
		GameView:true,
		BalanceBoards:true,
		Events:true,
		EventsView:false,
		Players:true,
		Characters:true,
		CharactersView:false,
		Resources:true,
		ResourcesView:false,
		InfluenceCards:true,
		InfluenceCardsView:false,
		WildCards:true,
		WildCardsView:true,
		Tradeables:true,
		TradeablesView:false,
		Messages:true,
		MessagesView:false
	},
	vent: _.extend({}, Backbone.Events),
	view: {},
	loggedin: 'hans', //user who is loggedin is hardwired for now
	User: null,
	House: null,
	
	titleCase: function(str){
	  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();})
	}
	
};

/*-- Set the LocalStorage Prefix for use in our Game --*/
Backbone.LocalStorage.setPrefix('HG');

/*-- listen for custom events --*/
HG.vent.on("component:initialized", function(args){
	if(args.component && HG.component[args.component]){
		//console.log('component:initialized ',args.component);
		//When fetching data from localstorage - data retrieval seems to happen too fast and some HG namespace values not set up in time
		//for the component:data-loaded event that's fired
		//so waiting until after intialization is complete to fetch.
		var componentFetch = HG.component[args.component]._fetch;//this is my wrapper function around the native backbone 'fetch' method
		if(componentFetch){
			componentFetch();
		}
	}
});

HG.vent.on("component:loaded", function(args){
	//Instantiate a version of whitelisted components as they load.
	//console.log('component:loaded: ',args.component);
	if( HG.init[args.component] ){
		//console.log('... and should initialize:',HG.init[args.component]);
    HG.component[args.component] = new HG[args.component]();
  }
	//console.log("... HG.component['",args.component,"'] = ",HG.component[args.component]);
	HG.loaded[args.component]    = true;
	HG.vent.trigger('component:initialized',{component:args.component});

	//set reference to GameView element
	if( HG.component.GameView && !HG.$el ){
		HG.$el = HG.component.GameView.$el;
  }

	//todo: roll the below into one - they use the same pattern
	//create and store instance of Characters View (once)
	if( HG.loaded.Characters && HG.loaded.CharactersView && !HG.component.CharactersView){
		//console.log("!HG.component.CharactersView:",!HG.component.CharactersView);
		//console.log('HG: initialize CharactersView');
	  HG.component.CharactersView = new HG.CharactersView( {collection:HG.component.Characters} );//data not available to render right away
  }

	//create and store instance of Characters View (once)
	if( HG.loaded.InfluenceCards && HG.loaded.InfluenceCardsView && !HG.component.InfluenceCardsView){
		//console.log('initialize InfluenceCardsView');
	  HG.component.InfluenceCardsView = new HG.InfluenceCardsView( {collection:HG.component.InfluenceCards} );
  }

	//create and store instance of Characters View (once)
	if( HG.loaded.Resources && HG.loaded.ResourcesView && !HG.component.ResourcesView){
		//console.log('HG: initialize ResourcesView');
	  HG.component.ResourcesView = new HG.ResourcesView( {collection:HG.component.Resources} );
  }

	//create and store instance of History Events View
	//note: different event sets could be passed into the view
	if( HG.loaded.Events && HG.loaded.EventsView && !HG.component.EventsView){
		//console.log('initialize EventsView');
	  HG.component.EventsView = new HG.EventsView( {collection:HG.component.Events} );
  }

	//create and store instance of Tradeables View
	if( HG.loaded.Tradeables && HG.loaded.TradeablesView && !HG.component.TradeablesView){
		//console.log('initialize TradeablesView');
	  HG.component.TradeablesView = new HG.TradeablesView( {collection:HG.component.Tradeables} );
  }

	//create and store instance of Messages View
	if( HG.loaded.Messages && HG.loaded.MessagesView && !HG.component.MessagesView){
		//console.log('initialize MessagesView');
	  HG.component.MessagesView = new HG.MessagesView( {collection:HG.component.Messages} );
  }

	//create and store instance of Players View
	if( HG.loaded.Players && HG.loaded.PlayersView && !HG.component.PlayersView){
		//console.log('HG: initialize PlayersView');
	  HG.component.PlayersView = new HG.PlayersView( {collection:HG.component.Players} );
  }
});

HG.vent.on("component:data-loaded", function(args){
	//console.log("HG component:data-loaded:",args);
	//Set a reference to the logged in user model, the house player and the play/turn order
	//note: where returns an array with one member - so we pop it off
  if(args.component === 'Players'){
	  HG.User  		= HG.component.Players.findWhere({name:HG.loggedin});
		HG.House 		= HG.component.Players.findWhere({name:'carl'});
		HG.playList	= [HG.User.get('name'), HG.House.get('name')];
		//console.log("HG.playList:",HG.playList);
		HG.vent.trigger('hg:play-list-created',{count:HG.playList.length});
		//console.log("HG.House loaded--",HG.House)
  }
});

HG.vent.on('request:add-card', function(config){
	//hmmm... this is not supposed to be here - it's biz logic - needs a new home (why not just in tradeables?)
	//console.log('HG caught- request:add-card with:',config);
	var card 			= config.card || null,
			User 			= HG.getCurrentUser(),
			UserCards	= User.get('cards'),
			type 			= config.type || null;
	if(card && type){
		card = (card.get) ? card.toJSON() : card; //normalize card reference
	  UserCards[type].push(card);
		User.save({'cards': UserCards}, {patch: true});
	}
});

//handle the 'trade:user-cards-upgraded' event
HG.vent.on('trade:user-cards-upgraded', function(config){
	//console.log('HG caught- user-cards-traded:',config);
	var type			= config.card.get('type') || null,
			User			= HG.getCurrentUser(),
			cards,
			canTrade,
			cb				= config.cb || null,
			complete	= null;
	if(type){
		cards = User.get('cards')[type];
		canTrade = HG.component.Tradeables.getCanTrade(cards);
		//console.log("canTrade: ",canTrade);
		complete = HG.component.GameView.renderCards(type, cards);
		User.set('canTrade',canTrade);
		//console.log("complete: ",complete);
		if(cb && complete){
			cb();
		}
	}
});

//handle the ' show a message' event
HG.vent.on('message:show', function(config){
	//console.log('HG caught- message:show:',config);
	var msgId 	= config.id || null,
			context	= config.context || null;
	if( msgId, context ){
	  //HG.showMessage(msgId, context);
		HG.addToMessageQueue({type:'show',id:msgId,'context':context});
	}
});

//handle the 'append to a message' event
HG.vent.on('message:append', function(config){
	//console.log('HG caught- message:append:',config);
	var msgId 	= config.id || null,
			context	= config.context || {};
	if( msgId, context ){
	  //HG.appendMessage(msgId, context);
		HG.addToMessageQueue({type:'append',id:msgId,'context':context});
	}
});

//Proxies for performing operations on the various Game components
//Called by sibling components to avoid coupling.

HG.getIsCharacterCompatibleWithAbility = function(characterId, abilities){
	return HG.component.Characters.getIsCompatibleWithAbility(characterId, abilities);
};

HG.getCharacterCard = function(config){
	return HG.component.Characters.getNext(config);
};

HG.putCharacterAbility = function(card,config){
	HG.component.Characters.putAbility(card, config);
};

HG.deleteCharacterAbility = function(card,config){
	HG.component.Characters.deleteAbility(card, config);
};

HG.getCharacterAbilityTotal = function(card){
	return HG.component.Characters.totalAbilities(card);
};

HG.setCharacterModelUnlocked = function(card){
	return HG.component.Characters.setModifierUnlocked(card);
};

HG.setCharacterModelEventRollAdjusted = function(character,adjustment){
	var currentEvtId = HG.getEventInPlay().get('id');
	HG.component.Characters.putEventRollAdjusted(character,adjustment,currentEvtId);
	//character.set(character,adjustment,currentEvtId);
};

HG.updateViewOnCharacterPicked = function(){
	HG.component.CharactersView.updateOnPicked();
}

HG.showPlayerCharacters = function(user, config){
	HG.component.CharactersView.showPlayerCharacters(user, config);
};

HG.removeCardFromUserModel = function(config){//todo:this is biz logic - belongs in Player
	//console.log("HG.removeCardFromUserModel: ",type,card);
	var User			= config.user || HG.getCurrentUser(),
			UserCards	= User.get('cards'),
			card			= config.card || {},
			cards 		= UserCards[config.type],
		  len 			= cards.length,
		  cardId		= (card.get)?card.get('id'):card,
			success;
		
	while(len--){
		//console.log("cards[len]: ",cards[len]);
		if(cards[len].id === cardId){
			success = cards.splice(len, 1);
			HG.vent.trigger('card-is-not-tradeable', {'cardId':cardId});
			break;
	  }
	}
	User.save({'cards': UserCards}, {patch: true});
	//return an array of matches, an empty array, or a single match (not in an array)
	return success;
}
HG.setUserModelAffiliation = function(user,affiliation){
	var user = (user.get)?user:HG.component.Players.findWhere({name:user});
	HG.component.Players.setAffiliation(user,affiliation);
}
HG.setUserModelCharacterInhand = function(user, characterId){
	var user = (user.get)?user:HG.component.Players.findWhere({name:user});
	HG.component.Players.setCharacterInhand(user,characterId);
}

HG.setUserModelRoll = function(username, val){
	//console.log("HG.updateUserModel: ",username, val);
	var user = HG.component.Players.findWhere({name:username});
	//console.log('user:',user);
	user.set('roll',val);
};

//username can be string or a user object
HG.setUserModelEventRoll = function(username, val){
	console.log("HG.setUserModelEventRoll: ",username, val);
	var user = (username.get) ? username : HG.component.Players.findWhere({name:username});
	//console.log('user:',user);
	user.set('eventRoll',val);
};

HG.setUserModelModifiedEventRoll = function(username, val){
	console.log("HG.setUserModelModifiedEventRoll: ",username, val);
	var user = (username.get) ? username : HG.component.Players.findWhere({name:username});
	//console.log('user:',user);
	user.set('eventRollModified',val);
};

HG.getUserModelAffiliation = function(username){
	//console.log("HG.getUserModelAffiliation: ",username);
	var user = HG.component.Players.findWhere({name:username});
	return user.get('affiliation');
};

HG.getUserByAffiliation = function(affiliation){
	return HG.component.Players.findWhere({'affiliation':affiliation})
};

HG.getUserModelCanTrade = function(username){
	//console.log("HG.getUserModelAffiliation: ",username);
	var user = HG.component.Players.findWhere({name:username});
	return user.get('canTrade');
};
//returns hash of blocked resources
HG.getUserModelBlocked = function(user){
	//console.log("HG.getUserModelBlocked: ",user);
	return HG.component.Players.getBlocked(user);
};
//returns boolean indicating if any resource blocked
HG.getUserIsBlocked = function(user){
	//console.log("HG.getUserIsBlocked: ",user);
	return HG.component.Players.getIsBlocked(user);
};

HG.putUserBlocked = function(user, cardType, qualifier, amount){
	return HG.component.Players.setAsBlocked({'user':user, 'cardType':cardType, 'qualifier':qualifier, 'amount':amount});
};

HG.addCardToUsersDeck = function(type, card, username){
	HG.component.Players.addCard(type, card, username);
};

HG.getUserHasCard = function(config){
	return HG.component.Players.hasCard(config);
};

HG.removeCardFromUserModelByAbility = function(config){
	return HG.component.Players.removeCard(config);
};

HG.getModifiedEventRoll = function(roll, currentUserTurn){
	var user = HG.getUserByName(currentUserTurn);
	return HG.component.Players.applyEventRollModifiers(roll, user);
};

HG.getModifiedResourceRoll = function(user){
	return HG.component.Players.applyResourceRollModifiers(user);
};

HG.getCurrentUserModelCanTrade = function(){
	var username = this.component.GameView.model.get('turn');
	return HG.getUserModelCanTrade(username);
};

HG.getFlagByAffilition = function(affiliation){
	return this.component.GameView.model.get('flags')[affiliation];
};

HG.getResourceIntervals = function(){
	return this.component.GameView.model.get('resourceIntervals');
};

HG.getGameModelAbilityThresholds = function(){
	return this.component.GameView.model.get('abilityThresholds');
};

HG.getAbilityTuples = function(){
	return this.component.GameView.model.get('abilityTuples');
};

HG.getRarityList = function(){
	return this.component.GameView.model.get('rarityList');
};

HG.eventBalanceRangeDefault = function(affiliation){
	return this.component.GameView.model.get('eventRangeDefaults')[affiliation];
};

HG.setUserDefaultResources = function(username){
	return this.component.GameView.assignDefaultResources(username);
};

HG.setUserDefaultInfluence = function(username){
	return this.component.GameView.assignDefaultInfluence(username);
};

HG.getState = function(){
	return this.component.GameView.model.get('module');
};

HG.getIsHouseTurn = function(){
	return (this.getState() === 'house');
};

HG.getUserByName = function(username){
	//console.log("HG.getUserByName: ",username);
	var user = HG.component.Players.findWhere({name:username});
	return user;
};

HG.setCanCurrentUserPlayEvent = function(historyEvent){
	return HG.component.Players.setCanPlayEvent(historyEvent);
};

HG.updateUserSummary = function(config){
	HG.component.PlayersView.updateSummary(config);
};

HG.getCurrentUserName = function(){
	//console.log("HG.getCurrentUserName");
	return HG.component.GameView.model.get('turn');
};

HG.getCurrentUser = function(){
	//console.log("HG.getCurrentUser");
	var name = this.getCurrentUserName(),
			user = this.getUserByName(name);
	//console.log("...name:",name," user:",user);
	return user;
};

HG.getCurrentUserIsHouse = function(){
	var housePlayer 	= HG.House.get('name'),
			currentPlayer	= HG.getCurrentUserName();
	return ( housePlayer === currentPlayer);
};

HG.getUserIsHouse = function(user){
	var housePlayer 	= HG.House.get('name'),
			user					= user.get('name');
	return ( housePlayer === user);
};

HG.getUserGreatestAbility = function(user){
	//console.log("HG.getUserGreatestAbility: ",user)
	return HG.component.Players.getGreatestAbility(user);
};

HG.getTotalUserAbilities = function(user){
	return HG.component.Players.getTotalAbilities();
};

HG.setUserAbilities = function(user){
	//console.log("HG.setUserAbilities user:",user);
	HG.component.Players.setAbilities(user);
};

HG.setUserPower = function(user){
	//console.log("HG.setUserPower user:",user);
	HG.component.Players.setPower(user);
};

HG.getTradeableSets = function(cards){
	//console.log("HG.getTradeableSets: ",cards);
	return HG.component.Tradeables.getTradeableSets(cards);
};

HG.tradeForUpgrade = function(cardId){
	//console.log("HG.tradeForUpgrade: ",cardId);
	return HG.component.TradeablesView.upgrade(cardId);
};

HG.startUsersResourcePump = function(user){
	HG.component.ResourcesView.startResourcePump(user);	
};

HG.stopUsersResourcePump = function(user){
	HG.component.ResourcesView.stopResourcePump(user);	
};

HG.evaluateResourcePump = function(user){
	HG.component.ResourcesView.evaluateResourcePump(user);
};

HG.getResourceCard = function(config){
	return HG.component.ResourcesView.drawCard(config);
}

HG.showMessage = function(msgId, context){
	HG.component.MessagesView.render(msgId, context);
};

HG.appendMessage = function(msgId, context){
	HG.component.MessagesView.append(msgId, context);
};

HG.animateMessage = function(msgId, context){
	//console.log("HG.animateMessage");
	HG.component.MessagesView.animate(msgId, context);
};

HG.addToMessageQueue = function(config){
	//config should be in the form of: {type:'show',id:msgId,'context':context}
	//for now - do not display messages generated by the house player.
	if( !HG.getCurrentUserIsHouse() ){
	  HG.component.MessagesView.addToQueue(config);
	}
};

HG.isEventInPlay = function(){
	//console.log("HG.isEventInPlay");
  return HG.component.Events.getIsInPlay();	
};

HG.getEventInPlay = function(){
	//console.log("HG.getEventInPlay");
  return HG.component.Events.getIsInPlay();	
};

HG.hasEventRequirements = function(evt, user){
	return HG.component.Events.requirement(evt, user);
}

HG.getCurrentEventVariety = function(){
	var current = HG.getEventInPlay();
	return HG.component.Events.getVariety( current );
}

HG.getRequirementCommands = function(directions){
	return HG.component.Events.createRequirementCommands(directions)
}

HG.getUserHasRequirement = function(user, command){
	return HG.component.Events.decomposeCommandsAndGetUserHasRequirement(user, command);
}

HG.getHasRequirement = function(user, command){
	return HG.component.Events.hasRequirement(user, command)
}

HG.setEventsModelInPlay = function(user, progressIdx, evtInPlay){
	console.log("HG.setEventsModelInPlay");
	HG.component.Events.resetEventsInPlay(user, progressIdx, evtInPlay);
}

/*-- Utility Methods --*/
//Load a template asynchronously
HG.getTemplate = function(path, cb){
	//console.log("HG.getTemplate - path:",path);
	var source,
			template;

	$.ajax({
		url: path,
	  success: function(data) {
	    source    = data;
	    template  = Handlebars.compile(source);    

	    //execute the callback if passed
	    if (cb) cb(template);
	  }.bind(this)
	});
};

HG.inRange = function(a, b, x){
	return (a <= x && x <= b);
};

//generate timers
HG.timerFactory = function(cb,duration){
	return window.setInterval(cb, duration);
};

/*-- Handlebars Helpers --*/
Handlebars.registerHelper('cardType', function(card) {
  return HG.titleCase( card.get('type') );
});

Handlebars.registerHelper('getVideo', function(overview) {
  return overview.video;
});

Handlebars.registerHelper('titleCase', function(str) {
  return (str) ? HG.titleCase( str ) : '';
});

/*-- 3rd Party Initializations --*/
$(document).ready(function() {
	$(".fancybox").fancybox();
});