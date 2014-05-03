/*--- Game Players View and Model ---*/
//Model for a Player
HG.PlayerModel = Backbone.Model.extend({
	defaults: {
		'name': null,
		'abilities':{},
		'affiliation': null,
		'blocked':{},
		'canTrade':false,
		'canPlayEvent':false,
		'cards':{
			'character':[],
			'resource':[],
			'influence':[],
			'wild':[]
		},
		'eventProgressIdx':0,
		'eventInPlay':null,
		'eventRoll': null,
		'power': null,
		'roll': null,
		'abilityThresholdIndexes':{
			'espionage':0,
			'military':0,
			'naval':0,
			'political':0,
			'social':0,
			'industrial':0
		},
		'tradingwell':[]
	}
});

//Instance of the player model
//HG.models.Player = new HG.PlayerModel();

//Collection of Players
HG.Players = Backbone.Collection.extend({
	model: HG.PlayerModel,//new HG.PlayerModel(),//HG.models.Player,
	url:'model/players.json',
	localStorage: true,
	
	initialize: function(){	
		_.bindAll(this,'_fetch','handleCardUpgrade','handleNewCard','handleEventSuccess','handleBlockedCard','handleRemoveCharacter');
		
		//Subscribe to custom events
		HG.vent.on('newcard',this.handleNewCard);
		HG.vent.on('events:change:current',this.handleCurrentEventChange);
		HG.vent.on('events:change:progess',this.handleEventProgress);
		HG.vent.on('card-is-tradeable',this.setCardIdAsTradeable);
		HG.vent.on('card-is-not-tradeable',this.setCardIdAsNotTradeable);
		HG.vent.on('trade:user-cards-upgraded', this.handleCardUpgrade);
		HG.vent.on('game:event-success', this.handleEventSuccess);
		HG.vent.on('game:change:balance',this.handleGameBalanceChange)
		HG.vent.on('player:add-card-blocked', this.handleBlockedCard);
		HG.vent.on('characters:remove-from-user',this.handleRemoveCharacter)
		
		this.on('change:abilities',this.handleAbilityChange,this);
		this.on('change:power',this.handlePowerChange,this);
		this.on('change:affiliation',this.handleAffiliationChange,this);
		this.on('change:eventRange',this.handleEventRangeChange,this);
		this.on('remove',function(evt){console.log("removed:",evt)});
	},
	_fetch: function(){
		//console.log("Players _fetch");
		this.fetch({
	    success: this.fetchSuccess,
	    error: this.fetchError
	  });
	},
	fetchSuccess: function (collection, response) {
		//console.log('Players fetchSuccess response:',response);
		HG.vent.trigger('component:data-loaded',{component:'Players'});
		//console.log("...should have fired the Players component:data-loaded custom event")	
  },

  fetchError: function (collection, response) {
    throw new Error("Player fetch error");
  },
  //Add one card to a given user model
  //notify listeners (e.g. view)
  addCard: function(type, card, username){
		//console.log("Player addCard: ",type, card, username);
		var newCard,
				User = (username.get) ? username: HG.getUserByName(username),
				cards = User.get('cards'),
				qualifier,
				added,
				blocked; 

		if(type && card){
			blocked = this.getBlocked(User);
			newCard = (card.toJSON) ? card.toJSON(): card;
			qualifier	= _.keys(newCard.ability).pop();
			//console.log("...newCard.ability",newCard.ability)
			//console.log("...qualifier:", qualifier);
			//console.log("...blocked[type]:", blocked[type]);
			if( !blocked[type] || (blocked[type] && !blocked[type][qualifier]) ){
				//console.log(..."!blocked[type][qualifier]");
				added	= true;
				//exception being character cards which player just draws from his existing (and finite) cardpack.
				if(type !== 'character'){
					//console.log("... adding to: ",User.get('cards')[type]);
	        cards[type].push(newCard);
				}
				//save to localStorage
				User.save({'cards': cards}, {patch: true});
				
	      //todo:investigate using a backbone setter on nested objects eg. user.cards.resources.push() 
				//- where cards is the prop being set currently - but resources should have a setter too.
	      HG.vent.trigger('newcard',{'card':card, 'username':username});
			}else if( blocked[type] && blocked[type][qualifier] ){
				console.log('user blocked from ',type,':',qualifier);
				added = false;
				HG.vent.trigger('player:add-card-blocked',{'type':type,'user':User,'ability':qualifier});
			}
    }

		return added;
  },
	//Find any conditions that effect the outcome of an event roll
	applyEventRollModifiers: function(roll, user){
		console.log("applyEventRollModifiers to:",roll," for: ",user.get('name'));
		var defender				= (HG.getUserIsHouse(user)) ? HG.User : HG.House,
				cards 					= [],
				variety					= HG.getCurrentEventVariety(),
				adjustment, normalizedRoll, gravy, affiliation, balance, character;
				
		//aggregate all the event matching character cards from both sides
		//defender first so that 'exceptional rolls' happen after defender's modifier
		//some characters may be in list more than once if they meet multiple conditions
		cards.push( this.getEventMatchingCharacters(defender,'event','balance') );
		cards.push( this.getEventMatchingCharacters(user,'event','balance') );
		cards.push( this.getResourceMatchingCharacters(user,'resource','balance') );
		cards.push( this.getPeopleMatchingCharacters(user,'people','balance') );
		cards = _.flatten(cards, true);
		console.log("Players applyEventRollModifiers...cards w/modifiers:",cards); 
		//Look through both sides characters for modifiers that will impact the event roll
		for(var i =0; i< cards.length; i++){
			character		= cards[i];
			affiliation = character.get('affiliation');
			balance			= character.get('modifier').bonus.balance; 
			adjustment 	= this.getAffiliationModifierDirection(affiliation, balance);
			HG.setCharacterModelEventRollAdjusted(character,adjustment);
			console.log(".... character ",character.get('name')," adjustment to roll:",adjustment);
			roll += adjustment;//push in the correct direction based on affiliation
			normalizedRoll	= this.normalizeAffiliationRoll(affiliation, roll);
			if(roll !== normalizedRoll){//roll was exceptional (e.g. 13+ or 1-) - apply influence to character
				console.log("..... exceptional roll: ",roll);
				gravy = Math.abs(roll - normalizedRoll);
				HG.vent.trigger('player:event-roll-modifier-bonus', {amount:gravy, ability:variety, characterId:character.get('id')});
				roll = normalizedRoll;
			}
			//todo:Generate message of some kind here - let user know how awesome is their character card.
						
		}				
				
		//console.log("..applyEventRollModifiers modified roll:",roll);
		return roll;
	},
	//Find any conditions that effect the outcome of a resource roll
	//return a config object which can be used to draw a more specific (upgraded) resource.
	applyResourceRollModifiers: function(user){
		console.log("Players applyResourceRollModifiers");
		var defender				= (HG.getUserIsHouse(user)) ? HG.User : HG.House,
				variety					= HG.getCurrentEventVariety(),
				config					= {rarity:'common'},
				adjusted				= false,
				rarityList			= HG.getRarityList(),
				characters			= [],
				len,character,rarity,proposedRarity,proposedRarityIdx,modifiers;
				console.log("...variety",variety);
		if( variety ){
			characters.push(this.getEventMatchingCharacters(user,'roll','rarity'));
			characters.push(this.getEventMatchingCharacters(defender,'roll','block'));
			characters = _.flatten(characters, true);
			
			len					= characters.length;
			console.log("... characters:",characters);
			while( len-- ){
				character	= characters[len];
				modifiers	= character.get('modifier');
				if( modifiers.bonus.block){
					//console.log(".... resource collection blocked");
					config	= {rarity:'blocked'};//set to an invalid 'rarity' value which will ensure no matches are returned.
					break;
				}else{
					proposedRarity 	= modifiers.bonus.rarity;
					if(adjusted){//if multiple characters have qualifing modifiers then bump up rarity another level.
						//but this is problematic - as duplicate rare cards can be gathered over a few rolls (and cards might be intended to be unique)
						//commenting out the below until there is a good strategy 
						//proposedRarityIdx = _.indexOf(rarityList, proposedRarity);
						//rarity						= rarityList[(proposedRarityIdx+1)];
					}else{
						rarity	= proposedRarity;
					}
					adjusted	= true;
					config.rarity = rarity;
					config.type		= variety;
				}
			}
		}
		//todo: generate a message for user so that they know the bonus has occured.
		console.log("...config:",config);
		return config;
	},
	//Remove a resource card by ability (rarity default of 'common')
	//by filtering users cards for match and then removing
	//returns card removed or null value
	//note: could just test for cards[len][ability] in while loop - skip the filter
	removeCard: function(config){
		//console.log("Players removeCard:",config);
		var User 				= config.user,
				config			= _.extend(config, {getCards: true}),
				candidate		= this.hasCard(config).pop(),
				type				= config.type,
				cards				= User.get('cards')[type],
				len					= cards.length;
				
		//now remove
		if(candidate){
			while(len--){
				//console.log("....cards[len]: ",cards[len]);
				if(cards[len].id === candidate.id){
					//console.log('.....match');
					success = cards.splice(len, 1);
					HG.vent.trigger('card-is-not-tradeable', {'cardId':candidate.id});
					break;
			  }
			}
		}
		return candidate;
	},
	//by default returns boolean indicating whether a card matching description is held by a given user.
	//optionally returns list of matches
	hasCard: function(config){
		//console.log("Players hasCard:",config);
		var User 				= config.user,
				type				= config.type,
				ability			= config.ability,
				determiner	= parseInt(config.determiner) || 1,
				amount			= parseInt(config.amount) || 1,
				getCards		= config.getCards || false,
				hasCard,
				rarity			= config.rarity,// || 'common',//defaulting to 'common' caused inadvertantly narrow searches
				cards				= User.get('cards')[type],
				len					= cards.length,
				candidates	= cards.filter(function(item){
								//below assumes that resources are plain old objects (not backbone models)
								//...but if they change to bb models - just use the 'get()' method.
								//console.log("...item: ",item," and ability:",ability," and amount:",amount);
								//console.log(".....item ability: ",item.ability[ability]);
								var rarityMatch = (rarity) ? (item.rarity === rarity) : true,//rarity is optional
										typeMatch		= (ability) ? (item.ability[ability]) : true,//ability is optional
										amountMatch	= ( parseInt(item.ability[ability]) >= amount );
								//console.log("......",rarityMatch,typeMatch, amountMatch);
  							return ( rarityMatch && typeMatch && amountMatch);
							});
		hasCard = (getCards) ? candidates : ( candidates.length >= determiner );
		return hasCard;
	},
	decrementBlockedValue: function(user,cardType,ability){
		//console.log("decrementBlockedValue");
		var blocked 				= user.get('blocked'),
				blockedAbility	= blocked[cardType][ability];
		//console.log("...blockedAbility before:",blockedAbility);
		blockedAbility--;
		if(blockedAbility <= 0){
			delete blocked[cardType][ability];
		}
		//console.log("...blocked:",blocked);
		user.set('blocked', blocked);
		user.save({'blocked': blocked}, {patch: true}); 
	},
	//Add a tradeable card to the user's "trading well"
	setCardIdAsTradeable: function(config){
	  //console.log("setCardIdAsTradeable: ", config);
	  HG.User.get('tradingwell').push(config.cardId);
		HG.vent.trigger('player:trading-card-update',{cards:HG.User.get('tradingwell')});
	},
	//Remove a card to the user's "trading well"
	setCardIdAsNotTradeable: function(config){
	  //console.log("setCardIdAsNotTradeable: ", config);
		var well = HG.User.get('tradingwell');
	  well.splice(well.indexOf(config.cardId), 1);
		HG.vent.trigger('player:trading-card-update',{cards:HG.User.get('tradingwell')});
	},
  //Based on cards picked set the player's affiliation
  //if different affiliations pick the one w/most ability points
  determineAffiliation: function(pickedCards){
	  //console.log("setPlayerAffiliation", pickedCards);
    var affiliation,
        cardOne = pickedCards[0],
        cardTwo = pickedCards[1],
				cardOneAff	= cardOne.get('affiliation'),
				cardTwoAff	= cardTwo.get('affiliation');
    if( cardOneAff === cardTwoAff ){
      affiliation = cardOneAff;
    }else{
      affiliation = (HG.getCharacterAbilityTotal(cardOne) >= HG.getCharacterAbilityTotal(cardTwo)) ? cardOneAff : cardTwoAff;
    }
    return affiliation;
  },
	setCanPlayEvent: function(historicEvent){
		console.log("Players setCanPlayEvent historicEvent:",historicEvent);
		var canPlay	= false,
				User		= HG.getCurrentUser();
		
		if(historicEvent){
			//HG.component.Events.findWhere({id:'CV-01'});//for dev only.. hardwire the event in play.
			//determine if current user can play the event on deck
			var	userAbilities		= this.getTotalAbilities(),//HG.getTotalCurrentUserAbilities(),
					historicEvent 	= historicEvent || {},
					evtTotal				= historicEvent.get('event_ability_total'),
					evtAbilities		= historicEvent.get('ability'),
					userEvtTotal		= 0,
					hasMin					= true,
					hasRequirements	= HG.hasEventRequirements(historicEvent, User);
		
			for( var a in evtAbilities){
				console.log("...user ", a, " = ",userAbilities[a]," vs Event min: ", evtAbilities[a]);
				hasMin = ( userAbilities[a] >= evtAbilities[a] );
				userEvtTotal += userAbilities[a];
				console.log("....userEvtTotal: ",userEvtTotal);
				if( !hasMin ){
					break
				};
			}
			console.log("...hasRequirements:",hasRequirements);	
			canPlay = (hasRequirements && hasMin && (userEvtTotal >= evtTotal) );
			console.log("...canPlay:",canPlay);
		}
		
		User.set('canPlayEvent',canPlay);
		User.save({'canPlayEvent':canPlay}, {patch: true});
		
		return canPlay;
	},
	//Adjust modifier amount so that it is beneficial to a given affiliation.
	getAffiliationModifierDirection: function(affiliation, modifier){
		var modifier = parseInt(modifier);
		return (affiliation === 'union') ? modifier: -(modifier);
	},
	//Given a user object - determine if they are they currently blocked from receiving resource cards of a kind.
  getIsBlocked: function(user){
		var blocked = null;
		if(user){
		  blocked = ( _.size(user.get('blocked')) > 0 );
		}
		return blocked;
	},
	getBlocked: function(user){
		if(user){
			return user.get('blocked');
		}
	},
	//Given a user return a list of their characters with modifiers whom can impact the event in play.
	//conditionType arg specifies 'event' or 'roll', bonusType arg specifes 'balance' or 'block'
	//conditionType can contain multiple values e.g. 'CV-02|CV-09'
	getEventMatchingCharacters: function(user,conditionType,bonusType){
		console.log("Player getEventMatchingCharacters for:",user.get('name')," and condition",conditionType);
		var cards				= user.get('cards'),
				characters	= this.getCharactersInHandWithModifiers(user),
				len					= characters.length,
				currentEvt	= HG.getEventInPlay(),
				variety			= HG.getCurrentEventVariety(),
				unlocked		= true,
				matching		= [],
				character,modifiers,evtStr,evtVarietyMatch,evtIdMatch,condition;
		//console.log('... characters:',characters);
		
		while( len-- ){
			character 			= characters[len];
			//console.log('... looking at character:',character.get('name'));
			modifiers 			= character.get('modifier');
			evtStr					= modifiers.condition[conditionType];
			//split condition string and potentially look through multiple conditions
			evtStrList			= (evtStr) ? evtStr.split('|') : [];
			for(var s = 0;s<evtStrList.length;s++){
				condition = evtStrList[s];
				//console.log(".... condition:",condition);
			
				evtVarietyMatch	= (condition === variety);
				evtIdMatch			= ( /[CV]{2}-\d{2}/.test(condition) && (condition === currentEvt.get('id')) );
				unlocked				= HG.setCharacterModelUnlocked(character);
				//console.log(".... modifies event w/type:",condition);
				//console.log(".... unlocked:",unlocked);
			
				if( condition && currentEvt ){
					//console.log("..... event in play and event based modifier condition");
					if(evtVarietyMatch || evtIdMatch){
						if(unlocked && modifiers.bonus[bonusType]){
							console.log("......",character.get('name')," modifies roll");
							matching.push(character);
						}
					}
				}
			}
			
		}
		//console.log("...matching:",matching);
		return matching;
	},
	//
	getCharactersInHandWithModifiers: function(user){
		//console.log("Player getCharactersInHandWithModifiers for ",user.get('name'));
		var characters;
		if(user){
			characters	= user.get('cards').character.filter(function(item){
				//console.log("...looking at:",item.get('name'));
				return ( item.get('inhand') && !_.isUndefined(item.get('modifier')) );
			})
		}
		//console.log("...found:",characters);
		return characters;
	},
	//find characters who get bonus based on some combination of resources currently in players hand
	getResourceMatchingCharacters: function(user,conditionType,bonusType){
		console.log("Player getResourceMatchingCharacters for:",user.get('name'));
		var matching		= [],
				cards				= user.get('cards'),
				characters	= this.getCharactersInHandWithModifiers(user),
				len					= characters.length,
				character,modifiers,directions,commands,commandLen,evtStrList,evtStrLen,condition,hasResourceRequirement;
				//console.log("...characters:",characters);
		//look through characters
		while( len-- ){
			character 			= characters[len];
			//console.log('.... looking at character:',character.get('name'));
			modifiers 			= character.get('modifier');
			directions			= modifiers.condition[conditionType];
			console.log(".... directions: ",directions);
			commands				= HG.getRequirementCommands(directions);
			console.log(".... commands: ",commands);
			commandLen			= commands.length;
			//determine if a character's bonus condition is met
			for(var s = 0; s<commandLen; s++){
				hasResourceRequirement = HG.getUserHasRequirement(user,commands[s]);
				if(hasResourceRequirement && modifiers.bonus[bonusType]){
					//console.log("...... pushing: ",character.get('name'));
					matching.push(character);
				}
			}
		}		
		return matching;
	},
	//find characters who get bonus based on being played with other characters
	getPeopleMatchingCharacters: function(user,conditionType,bonusType){
		console.log("Player getPeopleMatchingCharacters for:",user.get('name'));
		var matching			= [],
				cards					= user.get('cards'),
				characters		= this.getCharactersInHandWithModifiers(user),
				len						= characters.length,
				affinityList,
				affinityListLen,affinityCharacter,
				character,modifiers,hasResourceRequirement;
				//console.log("...characters:",characters);
		//look through characters
		while( len-- ){
			character 			= characters[len];
			//console.log('.... looking at character:',character.get('name'));
			modifiers 			= character.get('modifier');
			affinityList		= modifiers.condition[conditionType] || [];//many characters have no affinity list entry
			//console.log(".... affinityList: ",affinityList);
			affinityListLen			= affinityList.length;
			//determine if a character's bonus condition is met
			for(var s = 0; s<affinityListLen; s++){
				affinityCharacter = affinityList[s];
				
				if( /[CURPMSEI]{2}-\d{2}/.test(affinityCharacter) ){//a specific card (id) 
					//console.log('..... passed regex',affinityCharacter);
					hasResourceRequirement = cards.character.where({inhand:true,id:affinityCharacter}).length > 0;
					//console.log("..... hasResourceRequirement:",hasResourceRequirement);
					if(hasResourceRequirement && modifiers.bonus[bonusType]){
						matching.push(character);
						console.log("..... user has a character played with an affinity Character: ",affinityCharacter," ...bonus time!");
					}
				}
			}
		}		
		return matching;
	},
	//Calculate a player's total per ability using all character and resource cards currently in hand
  //optional 'user' arg (expected to be a user object) - defaults to current user
	//character cards must be of the same affiliation as Player
  getTotalAbilities: function(user){
    //console.log('getTotalAbilities user:',user);
    var abilities = {military:0,political:0,social:0,industrial:0,espionage:0},
				User 			= (user) ? user : HG.getCurrentUser(),
        cards			= User.get('cards').character.where({'inhand':true,'affiliation':User.get('affiliation')}),
				len				= cards.length,
				cardAbility,
				resources	= User.get('cards').resource;
		
		for(var i=0;i<len;i++){
			//console.log("..cards[i]: ",cards[i]);
				cardAbility = cards[i].get('ability');
        for( var x in cardAbility){
	  			abilities[x]+= cardAbility[x];
				}
		}

    $.each(resources, function(idx, value){
    	for( var i in resources[idx].ability){
	  		abilities[i]+= resources[idx].ability[i];
			}
    });

    return abilities;
  },
  //Get the most powerful ability of a player 
	//player determined by 'user' arg which can be either a string or an existing User object
	//returns object literal representing ability title and score
  getGreatestAbility: function(user){
		//console.log("Player getGreatestAbility - user: ",user);
		var ability = null,
				User;
				
		if(user){
    	var User 			= (typeof(user) == 'object') ? user : this.findWhere({name:user}),
					abilities	= User.get('abilities'),
        	title 		= null,
        	score 		= 0;
					//console.log("... abilities: ",abilities);
    	$.each(abilities, function(key,value){
	    	if(value > score){
		    	title = key,
		    	score = value
	    	}
    	});
			ability = {'title':title,'score':score};
		}
		//console.log('...',ability);
    return ability;
  },
  //Generate custom message in form of "union:ability:social:threshold:50" when a user's total abilities for a given category
	//pass those outlined in the game model ability thresholds.
	//after generating message - increment the index for the ability - so that on the next check it's using a new threshold value
	//this should be called when a user's abilities change in some way
	//todo: not checking for index out of bounds when looking up threshold value
	getIfPassedAbilityThresholds: function(user){
		//console.log("getIfPassedAbilityThresholds");
		var gameThresholds 		= HG.getGameModelAbilityThresholds(),
				userThresholdIdxs	= user.get('abilityThresholdIndexes'),
				oldAbilities			= user._previousAttributes.abilities, 
				newAbilities			= user.get('abilities'),
				userAbilityIdx,thresholdEventName;
		
		for(var i in newAbilities){
			userAbilityIdx = userThresholdIdxs[i];//user threshold index for a given ability
			if(newAbilities[i] > gameThresholds[i][userAbilityIdx] && newAbilities[i] > oldAbilities[i]){
				//console.log("userAbilityIdx before:",userAbilityIdx);
				//console.log('threshold for ',i,' passed.');
				thresholdEventName = user.get('affiliation')+':ability:'+i+':threshold:'+gameThresholds[i][userAbilityIdx];
				console.log("...thresholdEventName ",thresholdEventName)
				HG.vent.trigger(thresholdEventName,{id:thresholdEventName});
				userThresholdIdxs[i]++;
				//console.log("userAbilityIdx after:",userThresholdIdxs[i]);
				user.set('abilityThresholdIndexes',userThresholdIdxs);
				user.save({'abilityThresholdIndexes':userThresholdIdxs}, {patch: true});
			}
		}
	},
	handleAbilityChange: function(evt){
		//console.log("handleAbilityChange: ",evt);
		if(evt.changed && evt.changed.abilities){
			this.getIfPassedAbilityThresholds(evt)
		}
		var user 		= evt;
		this.setPower(user);//potentially the 'greatest' ability of record for a user has changed.
	},
	//decrement 'blocked' value.
	//once reaching 0 - delete the entry
	handleBlockedCard: function(config){
		console.log("handleBlockedCard: ",config);
		this.decrementBlockedValue(config.user, config.type, config.ability);
	},
	handleEventRangeChange: function(user){
		//console.log('handleEventRangeChange');
		var operand = (user.get('eventRange')[1]) - 1;
		user.set('eventRangeOperand',operand);
		user.save({'eventRangeOperand':operand}, {patch: true});
	},
	//Conditionally clip the range of an Event's loosing player.
	//e.g. from [2,7] -> [2,6]
	handleEventSuccess: function(config){
		//console.log("Players - handleEventSuccess: ",config);
		var loosingPlayer = config.looser,
				range;
		//decrement the loosing player's event range
		if( loosingPlayer  ){
			range	= loosingPlayer.get('eventRange');
			range[1] = ( range.pop() -1 );
			//console.log("... new range: ",range);
			this.setEventRange(loosingPlayer, range);
		}
		
	},
	//once the player's affiliation is known set up some dependent values
	handleAffiliationChange: function(evt){
		//console.log("handleAffiliationChange: ",evt);
		var affiliation	= evt.get('affiliation'),
				evtRange		= HG.eventBalanceRangeDefault(affiliation),
				operand			= (affiliation === 'confederate') ? evtRange[0] : evtRange[1],
				user				= evt;
		//assign the user a default, 'event balance range' based on affiliation		
		//console.log("...",evtRange);
		user.set({'eventRange':evtRange});
		user.save({'eventRange':evtRange}, {patch: true});
	},
	handleCardUpgrade: function(evt){
		//console.log("Player handleCardUpgrade - evt:",evt);
		this.resetTradingWell();
		this.setAbilities();
	},
	//When the event being played changes - user saves value
	handleCurrentEventChange: function(evt){
		//console.log("handleCurrentEventChange: ",evt);
		var idx 	= (evt.card)?evt.card.get('id'):null,
				user	= HG.getCurrentUser();
		//console.log("...idx:",idx);
		user.set('eventInPlay',idx);
		user.save({'eventInPlay': idx}, {patch: true});
	},
	handleEventProgress: function(evt){
		//console.log("handleEventProgress: ",evt);
		var idx = evt.eventIdx,
		user	= HG.getCurrentUser();
		user.set('eventProgressIdx',idx);
		user.save({'eventProgressIdx': idx}, {patch: true});
	},
	handleGameBalanceChange: function(evt){
		//console.log("Players handleGameBalanceChange: ",evt.evt," and .get method: ",evt.evt.get);
		var newBalance 	= (evt.evt.get)?evt.evt.get('eventBalance'):evt.evt,
				user				= HG.getCurrentUser();
		user.set('gameBalance',newBalance);
		user.save({'gameBalance': newBalance}, {patch: true});
	},
	//What should happen when a new card is added to user
	//determine if player can trade and
	//trigger a recount of player ability totals.
	handleNewCard: function(evt){
		//console.log("Player: handleNewCard: ",evt);
		var User 	= (evt.username.get) ? evt.username : HG.getCurrentUser(), 
				cards = User.get('cards').resource,
				canTrade	= HG.component.Tradeables.getCanTrade(cards);
				
		User.set('canTrade', canTrade);
		User.save({'canTrade': canTrade}, {patch: true});
		this.setAbilities();
	},
	handlePowerChange: function(evt){
		//console.log("Player: handlePowerChange: ",evt);
		HG.evaluateResourcePump(evt);
	},
	//What should happen when user rolls (may or may not get a card)
	handleRoll: function(evt){
		//console.log("Player: handleRoll: ",evt);
		var cards 		= HG.User.get('cards').resource,
				canTrade	= HG.component.Tradeables.getCanTrade(cards);
		HG.User.set('canTrade', canTrade);
		HG.User.save({'canTrade': canTrade}, {patch: true});	
	},
	//Removes model from the player's collection of character cards and persists change to localStorage
	//optionally pass in a user object - defaults to current user.
	handleRemoveCharacter: function(evt){
		console.log("Players handleRemoveCharacter evt:",evt);
		var cardId 	= evt.id,
				user		= evt.user || HG.getCurrentUser(),
				cards		= user.get('cards'),
				chars		= cards.character,
				card		= chars.findWhere({id:cardId}),//find character card for the current user
				inhand;
		console.log("... card:",card);		
		chars.remove(card);
		user.save({'cards': cards}, {patch: true});
	},
	//pull an exceptionally strong roll back into the affiliation range.
	//prevents roll from failing
	normalizeAffiliationRoll: function(affiliation, roll){
		//todo: be smarter about hardwired numbers below. pull from config?
		//todo: how also to get rid of refs to affiliation names?
		if(affiliation==='union' && roll > 12){
			roll = 12;
		}else if( affiliation==='confederate' && roll < 2 ){
			roll = 2;
		}
		return roll;
	},
	resetTradingWell: function(){
		//console.log("resetTradingWell");
		var User = HG.getCurrentUser();
		User.set('tradingwell',[]);
		User.save({'tradingwell':[]}, {patch: true});
	},
	/*-- House Methods ---*/
	//Set some common properties for the House player
	setUpHouse: function(){
		//console.log("!!! Player setUpHouse");
	  var affiliation 	= (HG.User.get('affiliation') === 'union') ? 'confederate':'union',
				evtRange			= HG.eventBalanceRangeDefault(affiliation),
				hasResources	= HG.House.get('cards').resource.length > 0,
				name					= HG.House.get('name'),
	      cards 				= HG.House.get('cards').character.where({'affiliation':affiliation}),
	      candidates  	= [];
		console.log("...hasResources already?", hasResources);
		//console.log('...House characters:',HG.House.get('cards').character.where({'inhand':true}));
	  //pick 2 cards of the right affiliation with higher than common rarity
		if(!hasResources){
		  $.each(cards, function(idx, card){
		    if(candidates.length < 2){
					//console.log("... selecting card for house:", card);
		      card.set('inhand', true);
		      candidates.push(card);
		    }
		  });

		  HG.House.set({'affiliation':affiliation});
			HG.House.save({'affiliation':affiliation}, {patch: true});
		  HG.House.set('abilities', this.getTotalAbilities(HG.House));
			HG.House.save({'abilities': this.getTotalAbilities(HG.House)}, {patch: true});
			HG.setUserDefaultResources(name);
			HG.setUserDefaultInfluence(name);
		}
		
		HG.startUsersResourcePump(HG.House);
		HG.updateUserSummary({user:HG.House});
	},
	//
	rollForResourcesHouse: function(){
	  //console.log('House.rollForResources');
	  House.roll = _roll();
	  if(House.roll === 7 && !HG.currentEvent){
	    //console.log('... 7===',rollTotal)
	    _setEventInPlay();
	  }else{
	    gotResource = _drawResourceGuideCard(rollTotal);
	    //console.log("... gotResource: ",gotResource);
	  }

	  House.canTrade = _getCanTrade();
	},
	setAbilities: function(user){
		//console.log("Player setAbilities");
		var User = (user) ? user : HG.getCurrentUser(),
				total	= this.getTotalAbilities(User);
		User.set('abilities', total);
		User.save({'abilities': total}, {patch: true});
	},
	setAffiliation: function(user, affiliation){
		//console.log("Players setAffiliation",user);
		user.set('affiliation',affiliation);
		user.save({'affiliation': affiliation}, {patch: true});
	},
	setAsBlocked: function(config){
		console.log("Player setAsBlocked: ",config);
		var User 						= (config.user) ? config.user : HG.getCurrentUser(),
				type						= config.cardType,
				amount					= config.amount,
				resourceAbility	= config.qualifier,
				currentBlocked	= User.get('blocked'),
				blocked					= {};
		
		blocked[type] ={};
		blocked[type][resourceAbility] = amount;
		//don't clobber	existing values of nested objects for a given card type
		if(currentBlocked[type]){
			//console.log("currentBlocked[type] before:",currentBlocked[type]);
			_.extend(currentBlocked[type], blocked[type]);
			//console.log("currentBlocked[type] after:",currentBlocked[type]);
		}else{
			_.extend(currentBlocked, blocked);
		}
		User.save({'blocked': currentBlocked}, {patch: true});
		return User.set('blocked', currentBlocked);
		
	},
	setCharacterInhand: function(user,cardId){
		console.log("Players setCharacterInhand");
		var userCards = user.get('cards');
		userCards.character.findWhere( {'id':cardId} ).set('inhand',true);
		user.save({'cards': userCards}, {patch: true});
	},
	setPower: function(user){
		//console.log("Player setPower")
		var User = (user) ? user : HG.getCurrentUser(),
				power	= this.getGreatestAbility(User);
		User.set('power', power);
		User.save({'power': power}, {patch: true});
	},
	setEventRange: function(user, range){
		console.log("Players - setEventRange: ",range);
		var User 		= (user.get) ? user : HG.getUserByName(user);
		if(User && range){
			User.set({'eventRange':range});
			User.save({'eventRange':range}, {patch: true});
		}
	}
	
});

 /*--- View ---*/
HG.PlayersView = Backbone.View.extend({
	el: $('.resource.cards'),
	$houseSummary: $('.house.summary'),
	$playerSummary: $('.player.summary'),
	
	initialize: function(){	
		_.bindAll(this,'updateAbilities','handleNewCard');
		//Listen for custom events
	  HG.vent.on('newcard',this.handleNewCard);	
		//Listen for model changes
		this.collection.on('change:abilities',this.updateAbilities,this);
		this.collection.on('change:affiliation',this.updateAffiliation,this);
		//this.collection.on('change:cards',this.updateSummary,this);
	},
	getUser: function(config){
		var User;
		if( config.username && config.username.get ){
			User = config.username;
		}else if( config.username ){
			User = HG.getUserByName(config.username);
		}else if(config.user){
			User = config.user;
		}else{
			User = HG.getCurrentUser();
		}
		return User;
	},
	handleNewCard: function(evt){
		//console.log('PlayersView handleNewCard: ',evt);
		var cardType 	= (evt.card.get)?evt.card.get('type'):evt.card.type,
				gameState	= HG.getState();
		if( cardType === 'resource'){
			//console.log("... adding new resource card to summary");
			this.updateResources(evt);
		}else	if( cardType === 'character'){
			//console.log("... adding new character card to summary");
			this.updateCharacters(evt);
		}
		
	},
	updateAffiliation: function(evt){
		//console.log("PlayersView - updateAffiliation: ",evt);
		var affiliation = evt.get('affiliation'),
				flagSrc			= HG.getFlagByAffilition(affiliation);
		$summary = ( evt.get('name') === HG.House.get('name') ) ? this.$houseSummary : this.$playerSummary
		$summary.find('.player-name .affiliation').html('('+affiliation+')');
		$summary.find('.player-name').prepend('<img src="'+flagSrc+'" class="flag"/>' );
	},
	updateAbilities: function(config){
		//Update the ability summary
		//console.log("PlayersView: updateAbilities summary");
		var User							= (config.username) ? HG.getUserByName(config.username) : (config.user ? config.user: HG.getCurrentUser()),
				userAbilities 		= User.get('abilities'),
				userIsHouse				= ( User.get('name') === HG.House.get('name') ),
				$summary					= ( userIsHouse ) ? this.$houseSummary : this.$playerSummary,
				abilityViewItems 	= $summary.find('.combined-abilities li'),
				len								= abilityViewItems.length,
				abilityClass,
				abilityVal;
				//console.log("... User: ",User.get('name'));
				//console.log("... $summary:",$summary);
		for(var i =0; i<len; i++){
			abilityClass 	= $(abilityViewItems[i]).attr('class');
			if(abilityClass){
				abilityVal		= userAbilities[abilityClass];
				//console.log("... ",abilityClass," val:",abilityVal);
			  $(abilityViewItems[i]).find('.ability-total').html(abilityVal);
			}
		}
	},
	updateCharacters: function(config){
		//console.log("PlayersView: updateCharacters");
		var User								= this.getUser(config),
				userIsHouse					= ( User.get('name') === HG.House.get('name') ),
				userCharacters 			= User.get('cards').character.where({'inhand':true}),
				$summary						= (userIsHouse) ? this.$houseSummary : this.$playerSummary,
				characterViewItems	= $summary.find('.player-characters'),
				len									= userCharacters.length,
				charId;
				
		$(characterViewItems).empty();
		
		for(var i=0; i<len; i++){
		  //conditionally update the resource summary
			//console.log("... appending character");
			charId = userCharacters[i].get("id");
			$(characterViewItems).append('<li id="summary_'+ charId +'" class="character"></li>');
		}
		
	},
	//for a given user (defaults to current) - update resource section of the summary UI
	// config param is object that can hold user, username, card
	// User context is in order: a user object, determined by a username, the current user.
	updateResources: function(config){
		//Update the resources summary
		//console.log("PlayersView: updateResources config:",config);
		
		var User							= this.getUser(config),
				userIsHouse				= ( User.get('name') === HG.House.get('name') ),
				userResources 		= User.get('cards').resource,
				$summary					= (userIsHouse) ? this.$houseSummary : this.$playerSummary,
				resourceViewItems = $summary.find('.player-resources'),
				houseTurn					= HG.getIsHouseTurn(),
				len								= userResources.length,
				maxCardDisplay		= 4,
				unseenCardCount		= null;
		
		//console.log("... $summary:",$summary);
		$(resourceViewItems).empty();
		
		for(var i=0; i<len; i++){
		  //conditionally update the resource summary
			if( i <= maxCardDisplay  || !userIsHouse ){
				//console.log("... appending resource");
			  $(resourceViewItems).append('<li id="summary_'+userResources[i].id+'" class="resource"></li>');
			}else{
				//Represent only the first n cards for the House player
				unseenCardCount = i - maxCardDisplay;
			}
		}
		//if we have an unseenCount then update the House summary UI
		if(unseenCardCount){
			$(resourceViewItems).append('<li class="unseen resource">+'+unseenCardCount+' more</li>');
		}
	},
	updateSummary: function(user){
		//console.log('PlayersView updateSummary');
		this.updateCharacters(user);
		this.updateResources(user);
		this.updateAbilities(user);
	}		
});

HG.vent.trigger('component:loaded',{component:'Players'});
HG.vent.trigger('component:loaded',{component:'PlayersView'});
