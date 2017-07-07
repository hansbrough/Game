/*--- Characters ---*/
//Model for a Character
HG.Character = Backbone.Model.extend({
	defaults: {
	  'id': null,
	  'name': '',
	  'headline': '',
		'inhand': false,
	  'affiliation': '',
	  'ability':{},
		'ability_change':{},
		'event_roll_adjusted':{},
	  'rarity':'',
	  'type': 'character',
		'unlocked': {}
	}
});

//Collection of Characters
HG.Characters = Backbone.Collection.extend({
	model: HG.Character,
	url:'model/characters.json',
	
	initialize: function(){
	  this.fetch({
	    success: this.fetchSuccess,
	    error: this.fetchError
	  });
	
	  _.bindAll(this,'handleCardAccepted','handleAbilityChange');
		HG.vent.on('influence:card-accepted', this.handleCardAccepted);
		HG.vent.on('player:event-roll-modifier-bonus', this.handleCardAccepted);//add influence on exceptionally modified event rolls e.g. 13 for Union player
		HG.vent.on('character:change:ability', this.handleAbilityChange);
		
		this.on('remove',function(e){
			console.log(" character collection remove handler");
		});
	},
	
	fetchSuccess: function (collection, response) {
      //console.log('Collection fetch success', response);
      //console.log('Collection models: ', collection.model);
  },
  fetchError: function (collection, response) {
        throw new Error("Characters fetch error");
    },
	createCardPack: function(characters){
	  //console.log('Characters createCardPack');
	  var allCards 		= _.shuffle(this.models),
	  		len 				= allCards.length,
	  		commonCnt 	= 0,
	  		uncommonCnt	= 0,
	  		rareCnt 		= 0,
	  		mythicCnt 	= 0,
	  		mythicRoll,
	  		CardPack 		= Backbone.Collection.extend({model: HG.Character}),
				cardPack		= new CardPack();
		
		//console.log('...cardPack: ',cardPack);
		//console.log("...allCards length:",len);
	  //todo: optimize repetitive code below
	
		//Vivify characters defintions passed in (from localStorage) or pick a new set
		if(characters && _.isArray(characters) ){
			//console.log("...Vivify");
			var charLen = characters.length;
			while(charLen--){
				cardPack.push( new HG.Character(characters[charLen]) );
			}
		}else{
		  while(len-- && cardPack.length < HG.component.GameView.model.get('packSize')){
		    var currentCard = allCards[len],//.toJSON();
						copy;
		    if(currentCard.get('rarity') === 'common' && commonCnt < 7){
		      copy = currentCard.clone();
		      cardPack.push(copy);
		      commonCnt++;
		    }else if(currentCard.get('rarity') === 'uncommon' && uncommonCnt < 3){
		      copy = currentCard.clone();
		      cardPack.push(copy);
		      uncommonCnt++;
		    }else if(currentCard.get('rarity') === 'rare' && rareCnt < 1){
		      copy = currentCard.clone();
		      cardPack.push(copy);
		      rareCnt++;
		    }
		  }
		}
		
	  //Bonus try for a mythic card  
	  if(Math.floor((Math.random()*100)+1) === 100){
	    //cardPack.push(HG.DS.mythicCharacter);
	  } 
		//console.log("...",cardPack);
	  return cardPack;
	},
	//Determine if character can accept an influence card
	getIsCompatibleWithAbility: function(characterId, abilities){
		//console.log("getIsCompatibleWithAbility");
		var characterCard 		= this.get({id:characterId}),
				characterAbility	= characterCard.get('ability'),
				isCompatible			= false;
		
		for( var a =0; a < abilities.length; a++ ){
			var candidate = abilities[a];
			//console.log("... looking for ",candidate," in ",characterAbility, ":", characterAbility[candidate]);
			if( characterAbility[candidate]){
				//console.log('character card is compatible with: ', candidate,' influence can be added');
				isCompatible = true;
				break;
			}
		}
		return isCompatible;
	},
	//
	handleCardAccepted: function(evt){
		console.log("Character handleCardAccepted evt:",evt);
		var card	= HG.getCurrentUser().get('cards').character.get({id:evt.characterId});
		this.putAbility(card, evt);
	},
	handleRemove: function(evt){
		console.log("Characters handleRemove:",evt);//just a stub - not currently removing cards from the master Character deck
	},
	//Trigger a recount of a players total abilities (of which this character is just one part)
	handleAbilityChange: function(evt){
		//console.log("Characters handleAbilityChange evt:",evt);
		HG.setUserAbilities();
		//check if character modifiers are unlocked
		this.setModifierUnlocked(evt.card);
	},
	//Get the next character card for the current user (or a given user)
	//optional filter params are 'ability' and 'affiliation' [true|false] - true value will filter on player's affiliation
	getNext: function(config){
		//console.log('Character getNext config:',config);
	  var config			= config || {},
				User				= config.user || HG.getCurrentUser(),
				affiliation	= (config.affiliation)?User.get('affiliation'):null,
				ability			= config.ability || null,
	      cards 			= User.get('cards').character.filter(function(item){
												//console.log("... item:",item);
												var inhandMatch 	= (item.get('inhand') === false),
														abilityMatch	= (ability) ? (item.get('ability')[ability]) : true;//'ability' match is optional
														affiliationMatch	= (affiliation) ? (item.get('affiliation') == affiliation) : true;//'affiliation' match is optional
														//console.log(".....inhandMatch:",inhandMatch," abilityMatch:",abilityMatch," affiliationMatch:",affiliationMatch);
		  									return ( inhandMatch && abilityMatch && affiliationMatch);
										}),
				card				= cards.pop();
		//console.log("...ability filter:",ability);
	  //console.log("...card:",card);
		if(card){
			card.set('inhand',true);
		}

	  return card;
	},
	totalAbilities: function(card){
		//console.log("Character totalAbilities");
		var abilities = card.get('ability'),
				total			= 0;
		for(var i in abilities){
			total += abilities[i]; 
		}
		return total;
	},
	//Update a character's ability
	//also make another entry for the delta of changed abilities
	putAbility: function(card, config){
		var characterAbility				= _.clone(card.get('ability')),
				characterAbilityChanged	= _.clone(card.get('ability_change')),
				amount									= parseInt(config.amount);
		//console.log("Characters putAbility() ability_change before:",characterAbilityChanged);
			
		if( !characterAbility[config.ability]){
			//console.log("... no characterAbility[config.ability]");
			characterAbility[config.ability] = amount;
		}else{
			//console.log("... yes characterAbility[config.ability]");
			characterAbility[config.ability] += amount;
		}
		//also update the 'ability_change' property that serves as a delta between original value and any ability of a given type throughout game
		if( !characterAbilityChanged[config.ability]){
			//console.log("... no characterAbilityChanged[config.ability]");
			characterAbilityChanged[config.ability] = amount;
		}else{
			//console.log("... yes characterAbilityChanged[config.ability]");
			characterAbilityChanged[config.ability] += amount; //NaN?
		}
		
		//console.log("Characters putAbility() ability_change after:",characterAbilityChanged);
		card.set('ability',characterAbility);
		card.set('ability_change',characterAbilityChanged);
		HG.vent.trigger('character:change:ability',{'card':card,'evt':config});//change event not firing automatically for some reason - trigger manually and add payload		
	},
	deleteAbility: function(card, config){
		var characterAbility	= card.get('ability'),
				target						= characterAbility[config.ability];
		//console.log("Characters deleteAbility- before:",characterAbility);	
		if(target){
			target -= parseInt(config.amount); 
			target = (target < 0) ? 0 : target;
		}
		characterAbility[config.ability] = target;
		//console.log("Characters deleteAbility after:",characterAbility);
		card.set('ability',characterAbility);
		HG.vent.trigger('character:change:ability',{'card':card,'evt':config});//change event not firing automatically for some reason - trigger manually and add payload		
	},
	//set a property that tracks which event rolls a given character has helped to adjust.
	putEventRollAdjusted: function(character,adjustment,currentEvtId){
		console.log("Characters putEventRollAdjusted:",character,adjustment,currentEvtId);
		var config = character.get('event_roll_adjusted');
		config[currentEvtId] = adjustment;
		console.log('...config',config);
		character.set('event_roll_adjusted',config);
	},
	//set value that tracks if a given modifier ability has been unlocked based on character properties
	setModifierUnlocked: function(card){
		console.log("Characters setModifierUnlocked:",card);
		var card 						= card || {},
				boosts					= card.get('ability_change'),
				charUnlocked		= _.clone(card.get('unlocked')),
				modifiers 			= card.get('modifier'),
				unlocked				= true,
				unlock, variety, needed;
				
		console.log("...boosts:",boosts," modifiers:",modifiers);
		if( modifiers && modifiers.condition && modifiers.condition.ability){
			unlocked				= false;//if they have an modifier condition - start by assuming they are locked.
			//console.log("....",card.get('name')," needs ",modifiers.condition.ability, " to unlock");
			unlock = modifiers.condition.ability.split(':');
			variety = unlock[0];
			needed	= unlock[1];
			//console.log(parseInt(boosts[unlock[0]])," >= ",parseInt(needed), "?");
			if( boosts[variety] && parseInt(boosts[variety]) >= parseInt(needed) ){
				//console.log("..... ",card.get('name')," unlocked");
				charUnlocked[variety] = true;
				card.set('unlocked',charUnlocked);
				unlocked = true;
				//todo: Generate a message with the good news.
			}
		}
	  return unlocked;
	},
	debugAddCardById: function(id,user){
			var card = this.findWhere({'id':id}),
					copy = card.clone();
			copy.set('inhand',true);
			//console.log("addCardById: ",copy);
			user.get('cards').character.push(copy);
	}

});

HG.CharactersView = Backbone.View.extend({
    el: $('.character.cards'),
		events:{
			'click .discard': 'discardCharacter'
		},
		myType:'character',
		append: function(card){
			//console.log("CharacterView... append: ",card);
			var card			= (card.toJSON) ? card.toJSON(): card,
					$el 			= this.$el;
			HG.getTemplate('js/templates/characters.tmpl', function(template){
				$el.append(template( {characters: card} ));
			});

      return this;
		},
		discardCharacter: function(e){
			//console.log("CharactersView discardCharacter this:",this);
			e.preventDefault();
			var $target	= $(e.target),
					cardId 	= $target.attr('data-card-id');
			//inform cloned player collection of characters that model should be removed.
			HG.vent.trigger('characters:remove-from-user',{id:cardId,user:HG.getCurrentUser()});
			//now update the UI (if it exists)
			if($target){
				$target.closest('li.inhand').remove();
			}
		},
		//expects a list of character models, converts attributes to json before rendering
    render: function(characterlist, config){
		  //console.log('render a characterlist:', characterlist);
			var config			= config || {},
					$el 				= this.$el,
					characters 	= [],
					card,
					len					= characterlist.length;
			for(var c=0;c<len;c++){
				card 	= characterlist[c];
				card	= (card.toJSON) ? card.toJSON(): card;
				if(config.hide){
					card.hide = true;
				}
				characters.push( card );
			}
			
			//console.log("... after json():",characters);
			HG.getTemplate('js/templates/characters.tmpl', function(template){
				$el.html(template( {characters: characters} ));
			});
      
      return this;  
    },
		replace: function(card){
			//console.log("CharacterView... gameState: ",HG.getState()," replace: ",card);
			var card			= (card.toJSON) ? card.toJSON(): card,
					cardId		= card.id,
					$el 			= this.$el,
					attr;	
					//console.log("... jsonified card:",card);
			
			HG.getTemplate('js/templates/characters.tmpl', function(template){
			  $('li[data-card-id="'+cardId+'"]').replaceWith( template( {characters: card} ) );	
			});	
		},
		//What the view should do when a new card is drawn/picked
		handleNewCard: function(evt){
	    //console.log('CharactersView handleNewCard: ',evt);
			var User;
			if( evt.username && evt.username.get ){
				User = evt.username;
			}else if( evt.username ){
				User = HG.getUserByName(evt.username);
			}else if(evt.user){
				User = evt.user;
			}else{
				User = HG.getCurrentUser();
			}
	    var cardType  	= (evt.card.get) ? evt.card.get('type') : evt.card.type
					state				= HG.getState(),
					userIsHouse	= HG.getUserIsHouse(User);
			//console.log('... type:',cardType,'==',this.myType);
			//console.log('... game state:',state);
		  if(cardType === this.myType && state != 'house' && !userIsHouse){
				//console.log("found character card: ",evt.card);
			  this.append(evt.card);
			}
	  },
		handleAbilityChange: function(config){
			//console.log("Character View - handleAbilityChange card:",config.card,' and ability object:',config.evt);
			var gameState		= HG.getState(),
					card				= config.card,
					abilityObj	= config.evt;
			//from here the 'inhand' characters view needs to be re-rendered
			if(gameState !== 'house'){
				this.replace(card);
			}else{
				//animate message like: 'Carl applied a Political Influence card to Varina Davis'
				HG.animateMessage('house_played_influence',{name:HG.House.get('name'), 'abilityType':abilityObj.ability, characterName:card.get('name')});
			}
		},
		//once it's been established whose turn it is for the first time- assign handler
		/*
		handleGameFirstTurn: function(){
			console.log("Characters handleGameFirstTurn");
			//HG.getCurrentUser().get('cards').character.on('change:ability', this.handleAbilityChange);
		},
		*/
		initialize: function(){
			//console.log("CharactersView initialize");
			//console.log("... HG.loaded.Players: ",HG.loaded.Players);
			_.bindAll(this,'handleNewCard','handleAbilityChange');
		  HG.vent.on('newcard',this.handleNewCard);
			//HG.vent.on('game:module:first-turn',this.handleGameFirstTurn);
		
			//listen for ability changes
			//this.collection.on('change:ability', this.handleAbilityChange);//no longer using cards straight from this.collection/ instead the user 
			//HG.getCurrentUser().get('cards').character.on('change:ability', this.handleAbilityChange);//but this is a bit pre-mature - as no characters yet
			HG.vent.on('character:change:ability',this.handleAbilityChange);
		},
		showPlayerCharacters: function(user, config){
			var config 	= config || {},
					fadeIn	= config.fade || false;
			this.render( user.get('cards').character.where({inhand:true}), {hide:false} );//todo:fadein not working currently.
			//this.$el.children('li.inhand').fadeIn();
		},
		updateOnPicked: function(){
			this.$el.children('li').not('.inhand').fadeOut();
			this.$el.find('a.pick').fadeOut(500);
		}
		
});

HG.vent.trigger('component:loaded',{component:'Characters'});
HG.vent.trigger('component:loaded',{component:'CharactersView'});
