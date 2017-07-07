//(function(){

//Scoped vars for convenience
//var User,House,Model;

//Model for the Game
HG.GameModel = Backbone.Model.extend({
	url:'model/game.json',
	defaults: {
	  currentEvent: null,
		eventBalance: 7,
		currentEventRoll: null,
	  currentRoll: null,
		module: null,
	  packSize: 10,
	  setupCharactersNum: 2,
		turn: null
	},
	initialize: function(){
		
	  this.fetch({
	    success: function (collection, response) {
				HG.vent.trigger('component:data-loaded',{component:'Game'});
	      //console.log('model fetch success', response);
	      //console.log('first arg: ', collection);
	    }
	  });
	
		this.on("change:eventBalance", this.handleEventBalanceChange, this);
	},
	handleEventBalanceChange: function(evt){
		/*
		console.log("GameModel: handleEventBalanceChange: ",evt);
		var balance = evt.changed.eventBalance,
				affiliation	= evt.get();
		//setResourceGuideByAffiliation(affiliation,index,value)
		this.get('resource_guides')[affiliation][index] = value;
		*/
	}
});

//Instance of the game model
HG.HistoryGame = new HG.GameModel();

//View for the Game
HG.GameView = Backbone.View.extend({
	el: '.game',
	model: HG.HistoryGame,
	events:{
	  'click .setup': 'moduleSetup',	
		'click .pick': 'pickCharacter',
		'click .start': 'moduleResources',
		'click .roll': 'routeRollTypeByGameState',
		'click .start-trading': 'moduleTrade',
		'click .play-event': 'moduleEvent',
		'click .pass-turn': 'modulePass',
		'click .next-player': 'moduleHouse'
	},
	$message: 		$('.message'),
	$die1: 				$('#die1'),
  $die2: 				$('#die2'),
	$roll: 				$('.roll'), 
	$evtBalance: 	$('.event-balance'),
	$resourceGuide: {},
	
	initialize: function(){
		//console.log("GameView initialization");
		_.bindAll(this,'setTurn','handleEventSuccess');
		
		//Subscribe to Model events
	  this.model.on("change:currentRoll", this.handleRollForResources, this);
		this.model.on("change:currentEventRoll", this.handleRollForEvent, this);
		this.model.on("change:eventBalance", this.handleEventBalanceChange, this);
	
		//Subscribe to custom events
	  this.$el.on('newEventInPlay',this.handleNewEventInPlay);
	  this.$el.on('newcard',this.handleNewCard);
	
		if(HG.playList){
			this.setTurn();
		}else{
			HG.vent.on('hg:play-list-created', this.setTurn);
		}
		
	  HG.vent.on('trade:user-cards-upgraded', this.renderMsg);
		HG.vent.on('game:event-success', this.handleEventSuccess);
		
	},
	//Why is this no longer used? doesnt seemed to be called.(4/18/14)
	//Used to be 'renderCardsInDeckByType()'
	//optional cards param. if not passed the render methods default to displaying all cards in their respective collections
	renderCards: function(cardType, cards){
		console.log("Game renderCards: ",cardType);
		var component,
				cards = cards || null,
				rendered = null;
		switch(cardType){
		  case "resource":
			  component = HG.component['ResourcesView'];
				break;
			case "character":
			  component = HG.component['Characters'];
				break;
			case "influence":
				component = HG.component['InfluenceCards'];
				break;
			case "wild":
				component = HG.component['WildCards'];
				break;
			default:
				console.log('... unknown card type');
			  break;
	  }
		if(component){
			rendered = component.render(cards);
		}
		return rendered;
	},
	renderMsg: function(config){
		var card 			= config.card || null,
				cardName	= card.get('name'),
				cardId		= card.get('id'),
				context		= {},
				msgId;
				
		//switch(){//nothing to conditionally switch on yet ...
			//case '':
				msgId = 'player_upgraded_card';
				context	= {name:cardName, id:cardId};
				//break;
		//}
		
		HG.vent.trigger('message:show',{id:msgId, 'context':context});
	},
	moduleSetup: function(){
		console.log('Setup Module');
		this.model.set('module', 'setup' );
		this.$el.removeClass('unbox');
		//If players have no cards then give them a cardpack
		//otherwise vivify cards from localStorage.
		var User 				= HG.getCurrentUser(),
				UserCards 	= User.get('cards'),
				HouseCards	= HG.House.get('cards'),
				affiliation,
				eventProgressIdx,
				eventInPlay,gameBalance;
		
		//note: Maybe House should have different cards every time.... more interesting
		if(HouseCards.character.length === 0){
			HouseCards.character = HG.component.Characters.createCardPack();
			HG.House.save({'cards': HouseCards}, {patch: true});	
		}else{
			HouseCards.character = HG.component.Characters.createCardPack(HouseCards.character);
		}
						
		if(UserCards.character.length === 0){
			UserCards.character = HG.component.Characters.createCardPack();
			User.save({'cards': UserCards}, {patch: true});
			//show User 5 cards to pick from
			HG.component.CharactersView.render( User.get('cards').character.slice(0,5) );
			this.$el.addClass('pick');
		}else{
			affiliation = User.get('affiliation');
			UserCards.character = HG.component.Characters.createCardPack(UserCards.character);//should be a Character proxy method
			
			HG.showPlayerCharacters(User,{fade:true});
			HG.component.GameView.$el.addClass(affiliation);//display summary
			
			//conditionally restart events that were in play during last session
			eventProgressIdx 	= User.get('eventProgressIdx');
			eventInPlay				=	User.get('eventInPlay');
			//console.log("...eventProgressIdx:",eventProgressIdx," eventInPlay:",eventInPlay);
			if(parseInt(eventProgressIdx) >= 0){
				HG.setEventsModelInPlay(User, eventProgressIdx, eventInPlay);
			}
			
			//conditionally reset the game balance from last session.
			gameBalance = User.get('gameBalance');
			//console.log("... gameBalance:",gameBalance);
			if(gameBalance){
				this.handleEventBalanceChange(gameBalance);
			}
			
			HG.updateUserSummary({user:User});
			HG.component.GameView.moduleFirstTurn();
			HG.component.GameView.moduleResources();
		}

		
	},
	//After game setup and player has picked their initial character cards - do these things once on their first turn.
	moduleFirstTurn: function(){
		console.log('First Turn Module');
		this.model.set('module', 'first-turn' );
		var UserCards = HG.getCurrentUser().get('cards');
		//HG.vent.trigger('game:module:first-turn');
		//give current user default resource cards for given affiliation
		//if they have none (prev session cards stored in localStorage)
		if(UserCards.resource.length === 0){
    	this.assignDefaultResources();
		}
		
		if(UserCards.influence.length === 0){
			this.assignDefaultInfluence();
		}else{
			HG.component.InfluenceCardsView.render();
		}
		//set up resource timer that gives current player cards automatically
		HG.startUsersResourcePump();
		//Set up values for House player
		HG.component.Players.setUpHouse();
		
		//TO BE REMOVED: DEBUG / DEV ACTIONS
		//HG.component.Characters.debugAddCardById('CS-01');
	},
	//Run the 'roll for resources' portion of the game
  moduleResources: function(){
    console.log('Resource Module');
		this.model.set('module', 'resources' );
		var User = HG.getCurrentUser();
		HG.vent.trigger('module:resources',{});
  		
    this.$el.removeClass('pick').addClass('trade').addClass('resources');
		this.$roll.attr('disabled', false);
		this.$die1.html(0);
    this.$die2.html(0);
		HG.vent.trigger('message:show',{id:'roll_for_resources', 'context':{name:HG.getCurrentUserName()}});
    //set ref to the correct resource guide card based on affiliation
    $resourceGuide = $('.resource-guide.' + User.get('affiliation'));
    //display any existing resource cards
    this.renderCardsInDeckByType( 'resource' );

  },
	moduleEvent: function(){
		console.log("Event Module");
		this.model.set('module', 'event' );
		
		if( HG.getCurrentUser().get('canPlayEvent') ){
			console.log("User can play event. Set up board.");
			//UI changes
			HG.vent.trigger('message:show',{id:'play_event', 'context':{}});
			this.$el.removeClass('pick').removeClass('trade').removeClass('resources').addClass('event-module');
			this.$roll.attr('disabled', false);
			this.$die1.html(0);
	    this.$die2.html(0);
		}
		return;
	},
	moduleTrade: function(){
		//note: this is becoming deprecated w/change to constant trade mode
    console.log('Trade Module');
		this.model.set('module', 'trade');
    this.$el.removeClass('resources').addClass('trade');
		HG.vent.trigger('message:show',{id:'lets_trade', 'context':{}});
		HG.vent.trigger('module:trade',{'trade':true});
  },
	//Point play to the next player in line for a turn. (largely a stub for now )
	// if 'House' player is next go to their special module.
	modulePass: function(){
		console.log('Pass Module');
		this.model.set('module', 'pass');
		var nextPlayer 	= this.getNextPlayer(),
				housePlayer	= HG.House.get('name');;
		this.model.set('turn', nextPlayer);
		if(nextPlayer === housePlayer){
			this.moduleHouse();
		}else{
			this.moduleResources();
		}
		//update the resource guide when a player's turn is over. (not sure this is the right spot - but here for now 3/20)
		//we don't want to update until after messaging has happened - otherwise the lookup is incorrect.
		this.setResourceGuideByEventStatus();//this changes model - so really doesn't belong in view (but Game has no collection)
		//reset/clear UI of any previous event balance board rolls
		this.eventBalanceReset();
	},
	moduleHouse: function(){
		//todo: perhaps the house module should be turned into a view? lots of specialized view logic below.
		console.log('House Module');
		this.model.set('module', 'house');
		var cards = HG.House.get('cards').resource,
				upgrades, upgradeCardId, upgradeCard, cardType, rollTotal,influenceCards,infLen,
				houseName = this.setTurnToHouse();//advance the playList so that the house player is first (keeps playlist in sync)
		//console.log("House player name is: ",houseName);
		this.model.set('turn', houseName );
		//Can he play an influence card?
		//if apply to first character.
		//todo: all this can be refactored w/code in influence.js - just a hack for now
		influenceCards 	= HG.House.get('cards').influence;
		infLen					= HG.House.get('cards').influence.length;
		var infCard,influenceAbility,influenceAbilityName,influenceAbilityValue,abilityTuples,characters,charId;

		if(  infLen > 0 ){
			//console.log("... has an influence card.");
			while(infLen--){
				infCard = influenceCards[infLen];
				influenceAbility	= infCard.ability;
				
				for(var i in influenceAbility){
					influenceAbilityName	= i;
					influenceAbilityValue	= influenceAbility[i];
					break;
				}
				
				abilityTuples 				= HG.getAbilityTuples()[influenceAbilityName];
				characters						= HG.House.get('cards').character.where({'inhand':true});
				//console.log(".... can be applied (?) to ", characters);
				for(var c =0;c<characters.length;c++){
					charId	= characters[c].get('id');
					//console.log("..... charId: ",charId);
					if( HG.getIsCharacterCompatibleWithAbility(charId, abilityTuples) ){
					  //console.log(".....", infCard.name," can be applied to House Character:",characters[c].get('id') );
						HG.vent.trigger('influence:card-accepted', {'characterId':charId, ability:influenceAbilityName, amount:influenceAbilityValue});
						HG.removeCardFromUserModel({type:'influence',card:infCard.id});
					}
				}
			}
		}
		
		this.rollForResources();
		//Can he trade?
		if( HG.getCurrentUserModelCanTrade() ){
			upgrades 			= HG.getTradeableSets(cards);
			upgradeCardId	= upgrades.pop().id;//just grab one for now - no smarts, todo later
			//console.log(HG.House.get('name')," can trade for: ",upgrades);
			upgradeCard 			= HG.tradeForUpgrade(upgradeCardId);
		}
		
		
		rollTotal	= HG.House.get('roll');
		newCardType	= this.getResourceGuideCardType(rollTotal);//bug: 7 automatically shows up as a resource card
		
		//HG.animateMessage('house_turn',{name:houseName, roll:HG.House.get('roll'), upgrade: upgradeCard, 'newCardType':newCardType, 'added':added});
		//Now it's the other player's turn.
		this.modulePass();
	},
	setTurn: function(){
		//console.log("GameView setTurn");
		this.model.set('turn', this.getNextPlayer() );
	},
	setTurnToHouse: function(){
		//console.log("setTurnToHouse");
		var next 	= this.getNextPlayer(),
				house	= HG.House.get('name');
		while(next !== house){
			next 	= this.getNextPlayer();
		};
		//console.log('... next:',next);
		return next;
	},
	//Set up default resources for current user based on affiliation and strongest ability
	//optionally assign to a given player rather than current player
	assignDefaultResources: function(name){
		//console.log('assignDefaultResources - name:',name);
    var User						= (name) ? HG.getUserByName(name) : HG.getCurrentUser(),
				userName				= User.get('name'),
				power        		= HG.getUserGreatestAbility(User),
        category     		= User.get('affiliation')+'_'+power.title,
        resourceList		= this.model.get('resourceDefaults')[category],
        card;
		//console.log('... category:',category);
    //console.log('... power:',power);
    $.each(resourceList, function(idx, val){
      card = HG.component.Resources.find( function(card){return card.id === val} ),
      HG.component.Players.addCard('resource', card, userName);
    });
  },
	//Set up default influence for current user based on affiliation and strongest ability
	//todo: this is a copy/paste of assignDefaultResources - combine methods
	assignDefaultInfluence: function(name){
		//console.log('assignDefaultInfluence - name:',name);
		var User						= (name) ? HG.getUserByName(name) : HG.getCurrentUser(),
				userName				= User.get('name'),
				category     		= User.get('affiliation'),
				infList					= this.model.get('influenceDefaults')[category],
        card;

		$.each(infList, function(idx, val){
			//console.log("...going to add inf card:",val);
			card = HG.component.InfluenceCards.find( function(card){return card.id === val} ),
		 	HG.component.Players.addCard('influence', card, userName);
		});
	},
	//return next player and move them to the back of the list.
	getNextPlayer: function(){
		var next = HG.playList.shift();
		//console.log("getNextPlayer next: ",next);
		HG.playList.push(next);
		return next;
	},
	//Use affiliation and rolltotal to determine a user's cardtype (if any)
	//first determine current user.
	getResourceGuideCardType: function(rollTotal){
		//console.log("getResourceGuideCardType: ",rollTotal);
		var cardType = null,
				affiliation, currentUserTurn;
		if(rollTotal){
			//console.log('getIsResourceGuideMatch ',rollTotal);
			rollTotal 			= rollTotal-1;
			currentUserTurn	= this.model.get('turn');
			affiliation			= HG.getUserModelAffiliation(currentUserTurn);
			//console.log('...affiliation', affiliation);
      cardType  			= this.model.get('resource_guides')[ affiliation ][rollTotal];
	  }
		return cardType;
	},
	//When event balance changes - update the UI
	//evt is either an event object w/an an eventBalance property or an int representing the eventBalance
	handleEventBalanceChange: function(evt){
		console.log('GameView - handleEventBalanceChange: ',this);
		var evtBalanceClassName = (evt.get)?'.'+evt.get('eventBalance'):'.'+evt;
		this.$evtBalance.find('li').removeClass('active');
		this.$evtBalance.find(evtBalanceClassName).addClass('active').removeClass('union confederate');
		HG.vent.trigger('game:change:balance',{evt:evt});//todo:GameView has biz logic - but no collection to act as a controller
	},
	handleEventSuccess: function(config){
		//console.log('GameView - handleEventSuccess: ',config);
		var affiliation = config.looser.get('affiliation'),
				balance			= this.model.get('eventBalance'),
				Event				= config.evt;
		//conditionally adjust event balance based on a given history event
		if( Event.get('adjust_balance') ){
			if( affiliation === 'union'){
				balance++;
			}else{
				balance--;
			}
			//console.log("... new event balance: ",balance);
			this.model.set('eventBalance',balance);//todo:convert the game balance to a balance board object
			this.setResourceGuideByAffiliation(affiliation, (balance-1), null);//restrict resource collection for looser
			//todo:other use cases for setting resource guide
			//1. a previous looser wins e.g. goes from 6 back to 7 - will need to revert null back to original value.
		}	
	},
	//What the game view should do when a new card is added to user's hand
	handleNewCard: function(evt){
		//console.log('Game view handleNewCard: ',evt);
		//watch for House player's new card events. these will come from
	},
	//What the game view should do when a new event is set in play
	handleNewEventInPlay: function(){
    //console.log('Game view handleNewEventInPlay',this);
    $(this).addClass('event-in-play');
  },
	//After a dice roll for an EVENT has occured handle how the results are used.
	handleRollForEvent: function(model, rollTotal){
		//console.log('handleRollForEvent: ',rollTotal);
		if(rollTotal){//ignore resets to 'null'
			var User									= HG.getCurrentUser(),
					attackerRange 				= User.get('eventRange'),
					attackerRangeOperand 	= User.get('eventRangeOperand'),
					attackerRollAbs				= Math.abs(attackerRangeOperand - rollTotal),
					attackerInRange				= HG.inRange(attackerRange[0], attackerRange[1], rollTotal),
					currentUserIsHouse		= HG.getCurrentUserIsHouse(),
					defenderRange, defenderInRange, defenderRangeOperand, defenderRollAbs,
					roll,
					msgId;
					//console.log("... attackerRollAbs:",attackerRollAbs);
				//Update event balance board with attacker's roll	
				this.eventBalanceMark( rollTotal, User.get('affiliation')+'-event-roll' );
			
				//console.log('...attackerInRange', attackerInRange);
				if(attackerInRange){
					//opposing player now defends
						//if defender is house - roll automatically
					if(!currentUserIsHouse){
						roll = this.roll();
						//console.log("...handleRollForEvent- house defense:", roll);
						HG.setUserModelEventRoll( HG.House, roll);
						defenderRange 				= HG.House.get('eventRange');
						defenderRangeOperand	= HG.House.get('eventRangeOperand');
						defenderRollAbs				= Math.abs(defenderRangeOperand - roll);
						//console.log("...handleRollForEvent- house defense abs:", defenderRollAbs);
						defenderInRange				= HG.inRange(defenderRange[0], defenderRange[1], roll);
						if(defenderInRange && ( defenderRollAbs <= attackerRollAbs ) ){
							msgId = 'event_roll_attack_blocked';
							//console.log("....event_roll_attack_blocked");
						}else{
							msgId = 'event_roll_attack_success';
							HG.vent.trigger('game:event-success',{evt:HG.getEventInPlay(), winner:User, looser:HG.House});
							//this.$el.removeClass('event-in-play');//not yet... let user absorb the after math
						}
						//Update event balance board with defender's roll	
						this.eventBalanceMark( roll, HG.House.get('affiliation')+'-event-roll' );
					}else{
						console.log('ask non-house player to make a defending roll');
					}
					
				}else{
					msgId = 'event_roll_attack_failed';
				}
		
								
			//trigger event to show message
			HG.vent.trigger('message:show',{id:msgId, 'context':{}});
			//move out of Event in play mode.
		}
	},
	//After a dice roll for a RESOURCE has occured handle how the results are used.
	handleRollForResources: function(model, rollTotal){
		console.log('handleRollForResources: ',rollTotal);
		var currentUserName	= this.model.get('turn'),
				User						= HG.getCurrentUser(),
				affiliation			= User.get('affiliation'),
				userName				= User.get('name'),
				eventBalance		= this.model.get('eventBalance'),
				added						= false,
				cardType, card, cards, canTrade, canPlayEvent, modified;
				
		//reset state of roll for this turn
		this.model.set('currentRollBlocked', false);	
				
		//console.log("...User:",User)
		//If 7 is rolled and an event should be played - else attempt to draw a card 
		//if an event is already in play then draw a resource card.
		if(rollTotal === 7){
			//if event in play already - pick a resource instead
			if(HG.isEventInPlay()){
				console.log("GameView: Event is already in play... draw a resource card.");
				cardType = 'resource';
				//if affiliation's event balance doesnt prevent user from drawing a card.
				if( (affiliation === 'union' && eventBalance < 8) || (affiliation === 'confederate' && eventBalance > 6) ){
				  card = HG.component['ResourcesView'].drawCard();
					//console.log("... got this card: ",card);
				}
			}else{
			  HG.component.Events.setNextInPlay();
			}
		}else{
		  cardType = this.getResourceGuideCardType(rollTotal);
		  switch(cardType){
			  case "resource":
					modified = HG.getModifiedResourceRoll(User);//get rarity and type in special cases
				  card = HG.component['ResourcesView'].drawCard(modified);
					break;
				case "character":
				  card = HG.component['Characters'].getNext();
					break;
				case "influence":
					card = HG.component['InfluenceCards'].drawCard();
					break;
				case "wild":
					card = HG.component['WildCards'].drawCard();
					break;
				default:
					console.log('... unknown card type');
				  break;
		  }
			console.log("...card: ",card)
			//Add the new card to user's hand.
		}
		if(card){
			console.log("GameView: got card will now add to players deck:",card);
      added = HG.component.Players.addCard(cardType, card, currentUserName);
			if(!added){
				console.log("GameView handleRollForResources - looks like card was blocked");
			}
		}
		
		//update state of roll for this turn
		if(modified && modified.rarity === 'blocked'){
			this.model.set('currentRollBlocked', true);	
		}
		
		
		//Update User properties
		HG.setCanCurrentUserPlayEvent( HG.getEventInPlay() );
		HG.setUserAbilities();
		
		//TODO: temp location of this method call? unsure where to put it...
		//determining if a user can trade should be done per roll (not just when a new card is drawn)
		//not appropriate for the Players component since below refs other components
		if(rollTotal){
		  cards = User.get('cards').resource;
			canTrade = HG.component.Tradeables.getCanTrade(cards);
			canPlayEvent = User.get('canPlayEvent');
		  User.set('canTrade', canTrade);
			if( HG.getIsHouseTurn() ){
				HG.animateMessage('house_turn',{name:userName, roll:rollTotal, 'newCardType':cardType, 'added':added});
			}else{
				var msgId;
			  console.log("added:",added,"...canTrade:",canTrade,' & canPlayEvent:',canPlayEvent);
				if( added && canTrade && canPlayEvent){
	      	msgId = 'you_got_a_card_can_trade_and_event';
	    	}else if( added && canTrade && !canPlayEvent){
					msgId = 'you_got_a_card_can_trade';
				}else if( added && !canTrade && canPlayEvent){
		      msgId = 'you_got_a_card_can_event';
		    }else if( !added && canTrade && !canPlayEvent){
					msgId = 'no_card_but_can_trade';
				}else if( !added && !canTrade && canPlayEvent){
					msgId = 'no_card_but_can_event';
				}else if( !added && canTrade && canPlayEvent){
					msgId = 'no_card_but_can_trade_or_event';
				}else {
	      	msgId = 'no_trade_no_event';
	    	}
				console.log("msgId: ",msgId);
				HG.vent.trigger('message:show',{id:msgId, 'context':{}});
			}
		}
		
		this.eventBalanceHighlight(rollTotal);
		this.updateResourceGuide(rollTotal);
	},
	pickCharacter: function(e){
		//console.log("pickCharacter");
		e.preventDefault();
		var pickedInt = HG.User.get('cards').character.where({'inhand':true}).length;
		//console.log("pickedInt: ",pickedInt, " HG.setupCharactersNum: ",this.model.get('setupCharactersNum'));
		
		//view like stuff below that effects the character card display belongs in the character views?
		if( pickedInt < this.model.get('setupCharactersNum') ){
			//console.log("pickedInt: ",pickedInt, " HG.setupCharactersNum: ",this.model.get('setupCharactersNum'));
			//console.log('can still pick');
			var $target = $(e.target),
	    $charCard 	= $target.closest('li'),
			$charCards  = HG.component.CharactersView, 
			cardId 			= $target.attr('data-card-id'),
			affiliation, context;

			HG.setUserModelCharacterInhand(HG.User, cardId);
			//console.log("... card:",card);
			//console.log('... House characters:',HG.House.get('cards').character.where({'inhand':true}));
	    $target.removeClass('btn-primary').addClass('btn-success').html('Picked!');
	    $charCard.addClass('inhand');
			
			//Fade out cards not picked.
			//hide the remaining pick buttons
			//Change the message
			if( pickedInt === 1){
				//console.log("max picked reached $charCards:",$charCards);
				HG.updateViewOnCharacterPicked();

				pickedCards = HG.User.get('cards').character.where({'inhand':true});
				affiliation = HG.component.Players.determineAffiliation(pickedCards);
				//console.log('...User characters:',HG.User.get('cards').character.where({'inhand':true}));
				HG.setUserModelAffiliation(HG.User,affiliation);	      
        HG.component.GameView.$el.addClass(affiliation);
				HG.setUserAbilities();
				//Start here: - firstTurn won't run here if user pulls characters from localStorage
				HG.component.GameView.moduleFirstTurn();//do some stuff only once after player has picked initial cards.

				context = {'name':HG.titleCase(HG.User.get('name')),'affiliation':affiliation};
				HG.vent.trigger('message:show',{id:'you_chose', 'context':context});
				
      }
		}
	},
	renderCardsInDeckByType: function( type ){
    //console.log("renderCardsInDeckByType: ",type);
    var cards = HG.User.get('cards')[type],
		viewMap = {resource:'ResourcesView'};
    
		//ask view of card type to render the given set of cards.
		HG.component[viewMap[type]].render(cards);
    
  },
	//Set the 'currentEventRoll' property back to it's original null value
	resetEventRoll: function(){
		//console.log("Game resetEventRoll");
		this.model.set('currentEventRoll', null);
	},
	//Roll dice in attempt to win an event
	rollForEvent: function(evt,config){
		//console.log('rollForEvent');
		var config = config || {}, 
				$target, currentUserTurn, roll, modifiedRoll;
		
		if(evt){
		  $target = $(evt.target);
		  $target.attr('disabled', true);
		}
		currentUserTurn = this.model.get('turn');
		roll = config.roll || this.roll();
		modifiedRoll = HG.getModifiedEventRoll(roll, currentUserTurn);//Lookup relevant modifiers
		HG.setUserModelEventRoll( currentUserTurn, roll);
		HG.setUserModelModifiedEventRoll( currentUserTurn, modifiedRoll);
		this.model.set('currentEventRoll', modifiedRoll);
		
	},
	//Roll dice for current player in an attempt to get a resource etc card.
	//todo: mixing data handling and UI in this function.
	rollForResources: function(e,config){
		//console.log('rollForResources');
		var config = config || {},
				$target,currentUserTurn,roll;
		
		if(e){
		  $target = $(e.target);
		  $target.attr('disabled', true);
		}
		this.resetEventRoll();
		currentUserTurn = this.model.get('turn');
		//console.log("currentUserTurn:",currentUserTurn);
		roll = config.roll || this.roll();
		HG.setUserModelRoll( currentUserTurn, roll);
		this.model.set('currentRoll', roll);
	},
	//Roll 2 six-sided Dice
	//todo: determine who should own the roll method... game or player.
  roll: function(){
		//console.log('roll');
    var d1 = Math.floor((Math.random()*6)+1), 
        d2 = Math.floor((Math.random()*6)+1),
        total = d1+d2;

    this.$die1.html(d1);
    this.$die2.html(d2);
    return d1+d2;
  },
	routeRollTypeByGameState: function(e){
		//console.log("routeRollTypeByGameState");
		var state = this.model.get('module');
		switch( state ){
			case 'resources':
				this.rollForResources(e);
				break;
			case 'event':
				this.rollForEvent(e);
				break;
			default:
				break;
		}
	},
	//update resource guide by affiliation and index
	//note: 'resource_guides' has a built in backbone setter - not sub-objects. hence the approach below.
	setResourceGuideByAffiliation: function(affiliation,index,value){
		//console.log("GameView: setResourceGuideByAffiliation: ",affiliation,index,value);
		if(affiliation && index){
			this.model.get('resource_guides')[affiliation][index] = value;
		}
	},
	//update the resource guide (used when event goes in/out of play).
	//when event in play - roll of 7 will draw a resource card for user.
	setResourceGuideByEventStatus: function(){
		//console.log("GameView: setResourceGuideByEventStatus");
		var value = null;
		if ( HG.isEventInPlay() ){
			value = 'resource';
		}
		this.setResourceGuideByAffiliation('union',6,value);
	  this.setResourceGuideByAffiliation('confederate',6,value);
	},
	eventBalanceHighlight: function( rollTotal ){
		//console.log('eventBalanceHighlight:',rollTotal);
		if(rollTotal){
		  var targetClass = 'li.'+ rollTotal;
      this.$evtBalance.find(targetClass).effect('highlight',1000);
		}
	},
	eventBalanceMark: function( rollTotal, affiliation ){
		//console.log('eventBalanceMark:',rollTotal);
		if(rollTotal){
		  var targetClass = 'li.'+ rollTotal;
      this.$evtBalance.find(targetClass).addClass(affiliation);
		}
	},
	eventBalanceReset: function(){
		//console.log('eventBalanceReset: ',this.$evtBalance.find('li'));
    this.$evtBalance.find('li').removeClass('union-event-roll').removeClass('confederate-event-roll');
	},
	updateResourceGuide: function( rollTotal ){
		//console.log('setResourceGuide:',rollTotal);
		if(rollTotal && (typeof $resourceGuide !== 'undefined')){
      var targetClass = 'li.'+rollTotal;
      $resourceGuide.find(targetClass).effect('highlight',2000);
		}
	},
	updateViewsOnRoll: function( model, rollTotal ){
		//console.log('updateViewsOnRoll:',model, rollTotal);
		this.eventBalanceHighlight(rollTotal);
		this.updateResourceGuide(rollTotal);
	},
	debug:{
		eventSuccess: function(eventId){
			HG.vent.trigger('game:event-success',{evt:HG.component.Events.findWhere({'id':eventId}), winner:HG.User, looser:HG.House});
		}
	}
});

HG.vent.trigger('component:loaded',{component:'GameView'});

//}());