/*--- Wild Cards ---*/
/*--- Todo: wild and influence cards are nearly identical - look into inheriting commonalities from a super class ---*/

//Model for an Wild Card 
HG.Wild = Backbone.Model.extend({
	defaults: {
      'id': null,
      'name': '',
      'description': '',
      'ability':{},
      'rarity': 'common',
      'type': 'influence'
	}
});

//Collection of Wild Cards
HG.WildCards = Backbone.Collection.extend({
	model: HG.Wild,
	url:'model/wild_cards.json',
	
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

HG.WildCardsView = Backbone.View.extend({
    el: $('.wild.cards'),
		myType:'wild',
		//Add a single card to the existing view of cards
		append: function(card){
			//console.log("... append: ",card);
			var template = Handlebars.compile( $("#wild-template").html() );
			$(this.el).append(template( {wild_card: card.toJSON()} ));
      return this;
		},
		//Replace existing view of cards with cards currently held by user model.
    render: function(){
			//below can be run from async jquery request to grab an individual template file instead of an inline script tag
			//http://www.jblotus.com/2011/05/24/keeping-your-handlebars-js-templates-organized/
      var template = Handlebars.compile( $("#wild-template").html() );
      $(this.el).html(template( {wild_card: HG.User.attributes.cards[this.myType]} ));
      return this;  
    },
		initialize: function(){
			//console.log('WildCardsView:',this)

			//Subscribe to custom events
			_.bindAll(this,'handleNewCard');
		  HG.vent.on('newcard',this.handleNewCard);			
		},
		//What the view should do when a new card is drawn/picked
		handleNewCard: function(evt){
	    //console.log('WildCardsView handleNewCard: ',evt);
	    var cardType = (evt.card.get)?evt.card.get('type'):evt.card.type;
		  if(cardType === this.myType){
				//console.log("found wild card: ",evt.card);
			  this.append(evt.card);
			}
	  }
		
});

HG.vent.trigger('component:loaded',{component:'WildCards'});
HG.vent.trigger('component:loaded',{component:'WildCardsView'});
