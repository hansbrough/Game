/*--- Influence Cards ---*/
/*--- Todo: wild and influence cards are nearly identical - look into inheriting commonalities from a super class ---*/

//Model for an Influence Card 
HG.Influence = Backbone.Model.extend({
	defaults: {
      'id': null,
      'name': '',
      'description': '',
      'ability':{},
      'rarity': 'common',
      'type': 'influence'
	}
});

//Collection of Influence Cards
HG.InfluenceCards = Backbone.Collection.extend({
	model: HG.Influence,
	url:'model/influence_cards.json',
	
	initialize: function(){
	  this.fetch({
	    success: this.fetchSuccess,
	    error: this.fetchError
	  });
			
	},
	
	fetchSuccess: function (collection, response) {
    //console.log('Events Collection fetch success', response);
    //console.log('Collection models: ', collection.model);
  },

  fetchError: function (collection, response) {
    throw new Error("fetch error");
  },
	//Draw/Pick a random resource card
	drawCard: function(){
		//console.log("drawCard: ");
		var card = null;
		card = this.getCardByRarity('common');
		//_addCardToUserModel(cardType, card);
	  
		return card;
	},
	//Get a resource and add it to the users card set
	getCardByRarity: function(rarity){
	  //console.log("getCardByRarity: ",rarity);
	  var cards = _.shuffle( this.where({'rarity':rarity}) ),
	      card  = cards.pop();

	  return card;
	}
	
});

HG.InfluenceCardsView = Backbone.View.extend({
    el: $('.influence.cards'),
		myType:'influence',
		//Add a single card to the existing view of cards
		append: function(card){
			console.log("Influence add card:",card);
			var $el 	= this.$el,
					card 	= (card.toJSON) ? card.toJSON(): card;
			
			HG.getTemplate('js/templates/influence.tmpl', function(template){
				$el.append(template( {influence_card: card} ));
			});
			
      return this;
		},
		//Replace existing view of cards with cards currently held by user model.
    render: function(cardList){
			console.log("Influence render cardList:",cardList);
			var $el 	= this.$el,
			cardList 	= (cardList) ? cardList: HG.User.get('cards')[this.myType];//todo:should this really be hardwired to HG.User?
			console.log("... cardList:",cardList);
			HG.getTemplate('js/templates/influence.tmpl', function(template){
				$el.html(template( {influence_card: cardList} ));
			});
      return this;  
    },
		initialize: function(){
			//console.log('InfluenceCardsView:',this)

			_.bindAll(this,'handleNewCard','handleCardApplied');
			
			//Subscribe to custom events
		  HG.vent.on('newcard',this.handleNewCard);		
			HG.vent.on('influence:card-applied',this.handleCardApplied);
		
		},
		handleCardApplied: function(evt){
			console.log("handleCardApplied evt:",evt);
			//below could be 'getIsCompatibleWithAbility()' in Characters
			var influenceId 			= evt.infId,
					characterId 			= evt.charId,
					influenceCard	 		= this.collection.get({id:influenceId}),
					influenceAbility	= influenceCard.get('ability'),
					influenceAbilityName,influenceAbilityValue, abilityTuples;
					
			for(var i in influenceAbility){
				influenceAbilityName = i;
				influenceAbilityValue = influenceAbility[i];
				break;
			}
			
			abilityTuples 		= HG.getAbilityTuples()[influenceAbilityName];
			
			if( HG.getIsCharacterCompatibleWithAbility(characterId, abilityTuples) ){
				//console.log("... isCompat!");
				//
				//$(evt.draggable).effect("transfer", { to: $(evt.droppable) }, 1000).toggle( "fade" );
				$(evt.draggable).toggle( "fade" );
				//add ability to card UI e.g. +5 to existing ability or add new ability category
				
				//add/set ability bonus to the card model (w/out coupling)
				HG.vent.trigger('influence:card-accepted', {'characterId':characterId, ability:influenceAbilityName, amount:influenceAbilityValue});
				//remove influence card from User's card model
				HG.removeCardFromUserModel({type:'influence',card:influenceId});
			}
		},
		//What the view should do when a new card is drawn/picked
		handleNewCard: function(evt){
			var cardType 	= (evt.card.get)?evt.card.get('type'):evt.card.type,
					cardsUser	= evt.username;
					
		  if(cardType === this.myType){
				console.log("InfluenceCardsView handleNewCard card: ",evt.card);
				if( cardsUser !== HG.House.get('name') ){
			    this.append(evt.card);
			
					$('.influence.cards>li').draggable({ snap: '.character.cards .inhand','cursor':'pointer' });
					$('.character.cards .inhand').droppable({ accept: '.influence.cards>li', hoverClass: 'drop-hover',
						activate: function( e, ui ) {
							//console.log("droppable activate:",e.target);
							//determine here what target's can accept the ability (use logic in handleCard applied)
							//change UI of droppable elements
							//toggle off when 'deactivated'
							$(e.target).effect('highlight');
						},
						deactivate: function( e, ui ) {
							//toggle off droppable ui changes when 'deactivated'
						},
		        drop: function(e, ui){
			        infId 	= ui.draggable.attr('id'),
							charId	= $(e.target).attr('data-card-id');
							//$(e.target).effect('highlight');
							HG.vent.trigger('influence:card-applied', {'infId':infId,'charId':charId, 'draggable':ui.draggable, 'droppable':e.target});
			      },
						out: function(e, ui){
							//cardId = ui.draggable.attr('id');
							//HG.vent.trigger('card-is-not-tradeable', {'cardId':cardId});
			      } 
		      });
			
				}
			}
	  }
		
});

HG.vent.trigger('component:loaded',{component:'InfluenceCards'});
HG.vent.trigger('component:loaded',{component:'InfluenceCardsView'});
