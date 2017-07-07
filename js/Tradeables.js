//Model for a Tradeable set 
HG.Tradeable = Backbone.Model.extend({
	defaults: {
      'id': null,
      'combination':{}
	}
});

//Collection of Tradeable Sets
HG.Tradeables = Backbone.Collection.extend({
	model: HG.Tradeable,
	url:'model/tradeables.json',
	
	initialize: function(){
	  this.fetch();
	},
	
  //Determine if a user can trade based on their current cards.
  //Condition 1: Look through tradable combinations of cards and determine is user has matching resources.
  //Condition 2:
  getCanTrade: function(cards){
		//console.log("Tradeables: getCanTrade cards: ",cards);
    var canTrade = false,
        cards = cards || [],
				setLen,set,
      	tradeMap = this.toJSON();
		//console.log(tradeMap);
    //condition 1: they have enough resource cards to trade up.
		//console.log("...cards: ",cards);
		setLen = tradeMap.length;
		
		allTradeableSets:		
		while(setLen--){
			set = tradeMap[setLen];
			//if matching set found then user can trade and no need to look further.
      if( this.isSubset(set.combination, cards) ){
      	canTrade = true;
       	break allTradeableSets;
      }
		}
		
    return canTrade;
  },
	//based on a list of cards determine what they can trade for...
  //returns a list of card id's e.g. ['UR-07']  
	getTradeableSets: function(cards){
	  //console.log("Tradeables: getTradeableSets: ",cards);
	 	var cards    	= cards || [],
        tradable 	= [],
        tradeMap 	= this.toJSON(),
				setLen 		= tradeMap.length,
        set,hasCard,hasSet,len;
				//console.log("...tradeMap: ",tradeMap);
		while(setLen--){
			set = tradeMap[setLen];
			//if matching set found then user - save it
		  if( this.isSubset(set.combination, cards) ){
				//console.log("... tradeable set found!! : ", set.combination);
		  	tradable.push(set);
		 	}
		}
		return tradable;
	},
	//determine if a tradeable combination of card id's exist within a set of cards objects
	//expects forms of {"CR-02":2,"CR-05":1} to be found in [{cardObj1},{cardObj2},etc]
	isSubset: function(tradeable_combination, cards){
		//console.log("isSubset cards:",cards);
		var hasCard,
				cardId,
		    hasSet=true,
		    len;
		
		tradeableSetLoop:
		for(var item in tradeable_combination){
			//console.log('...',item);
			//does tradeable card exist in the user's resources?
			hasCard = false;
			len = cards.length;
			while(len--){
				//console.log("...... user card: ",cards[len].id);
				cardId = (cards[len].id) ? cards[len].id : cards[len]; //card object or an id string
  		  if(cardId === item){
    		  hasCard = true;
    		  break;
  			}
		  }
			if(!hasCard){
  		  //console.log('...user does not have ',item,' required for set: ',tradeable_combination, ' - so no point looking further');
  			hasSet = false;
  			break tradeableSetLoop;
		  }
		}
		//console.log("..... has set:",hasSet);
		return hasSet;
	}
  
});

HG.TradeablesView = Backbone.View.extend({
    el: $('.trade-container'),
		events:{
		  'click .tradeable': 'upgrade'
		},
		$well: $('#trading-well'),
		$tradingUpgrades: $('.trade-container .upgrades'),
		append: function(){
			//
		},
    render: function(){
		  //  
    },
		initialize: function(){
			//console.log("TradeablesView initialize");
			_.bindAll(this,'handleTradeModuleStart','handleNewTradeable','handleNewCard','upgrade');
		  HG.vent.on('module:trade',this.handleTradeModuleStart);
		  HG.vent.on('player:trading-card-update',this.handleNewTradeable);
			HG.vent.on('newcard',this.handleNewCard);
		},
		handleNewCard: function(evt){
			//console.log("Tradables handleNewCard evt:",evt);
			var card 		= evt.card;
			
			if( !HG.getIsHouseTurn() ){
				this.handleNewTradeable( {cards:HG.getCurrentUser().get('cards').resource} );
			}
					
		},
		handleTradeModuleStart: function(){
		  //console.log("Tradeables: HandleTradeModuleStart resource.cards: ",$('.resource.cards>li') );
		  //console.log("Tradeables: HandleTradeModuleStart canTrade: ",HG.getUserModelCanTrade('hans') );
			var canTrade = HG.getCurrentUserModelCanTrade(), 
					cardId;
			if(canTrade){
				
					//console.log("handleTradeModuleStart: can trade and not houses turn");
				  $('.resource.cards>li').draggable({ snap: '#trading-well','cursor':'pointer' });	
					this.$well.droppable({ accept: '.resource.cards>li', hoverClass: 'drop-hover',
		        drop: function(e, ui){
			        cardId = ui.draggable.attr('id');
							$(e.target).effect('highlight');
							HG.vent.trigger('card-is-tradeable', {'cardId':cardId});
			      },
						out: function(e, ui){
							cardId = ui.draggable.attr('id');
							HG.vent.trigger('card-is-not-tradeable', {'cardId':cardId});
			      } 
		      });
				
			}else{
				HG.vent.trigger('message:append', {id:'next_player'});
			}
		
		},
		//Handle event generated when a card is added OR removed from the User's trading well ( which is an array of strings)
		//if no 'cards' config value - default to current users resource cards.
	  handleNewTradeable: function(config){
			//console.log("handleNewTradeable: ",config);
			if( !HG.getIsHouseTurn() ){
				//console.log('handleNewTradeable: ....not the house turn:',!HG.getIsHouseTurn())
		    var cards = config.cards || HG.getCurrentUser().get('cards').resource, 
						tradeableSets = this.collection.getTradeableSets(cards),
		        card,cardId,displayId,displayName,
		        len = tradeableSets.length;

		    //console.log('handleNewTradeable:... ',tradeableSets,' length:',tradeableSets.length);
		    this.$tradingUpgrades.empty();
		    if(len > 0){
		      while(len--){
						cardId = tradeableSets[len].id;
						//console.log('...  tradeable set cardId:',cardId);
		        card = HG.component.Resources.findWhere({id:cardId});
						displayId = card.get('id');
						displayName = card.get('name');
						//todo: on inline markup like below - use a handlebars template
		        this.$tradingUpgrades.append('<a class="badge badge-info tradeable" data-card-id="'+displayId+'">'+displayName+' ('+displayId+')</a>');
		      }
		      this.$tradingUpgrades.effect('highlight');
		    }else{
					//console.log("handleNewTradeable: ......nothing tradable for: ",HG.getCurrentUserName());
		      this.$tradingUpgrades.append('<span class="badge badge-info not-tradeable">nothing tradeable</span>');
		    }
			}
	  },
		//Swap a set of user cards for a new card (an upgrade)
		//evt arg can be actual event or a string representing a resource card id
	  upgrade: function(evt){
			//console.log("Tradeables-upgrade evt: ",evt);
	    //find required cards for the upgrade
	    var upgradeId 	= (typeof(evt) === 'object') ? $(evt.target).attr('data-card-id') : evt,
			    collection 	= this.collection,
					tradeable 	= collection.findWhere({id:upgradeId}),
					components 	= tradeable.get('combination'),
	        cardType   	= 'resource',
	        newCard			= null,
					upgradeSignature,affiliation,
					model;
	    //console.log("...components: ",components);
			//console.log("collection:",collection);
	    //remove cards from users resource data model
	    $.each(components, function(key,value){
				//console.log(" ...key:",key);
				HG.removeCardFromUserModel({type:cardType,card:key});//proxy call to the User object (or replace with custom event call)
	    });
	    //add new (upgraded) card to users resource model
	    newCard = HG.component.Resources.findWhere({id:upgradeId});
			HG.vent.trigger('request:add-card',{card: newCard, 'type': cardType});//let HG deal w/ proxying a call
	    //update the trading well ui
	    //this.handleNewTradeable();//needs user's tradingwell as an argument which is coupling... 
	    //inform any listeners that cards have been traded
	    HG.vent.trigger('trade:user-cards-upgraded',{'card': newCard, cb: this.handleTradeModuleStart});
			//All well and good but generate an event with a name reflecting the specific card (decoupling - don't make listeners inspect a payload)
			//e.g. balance boards looking for specific upgrades (like a 'factory' / 'UR-11')
			affiliation = HG.getCurrentUser().get('affiliation');
			upgradeSignature = 'trade:upgrade:'+affiliation+":"+upgradeId;
			console.log("...upgradeSignature:",upgradeSignature)
			HG.vent.trigger(upgradeSignature,{id:upgradeSignature});
			
			return newCard;
	  }
	  
});

HG.vent.trigger('component:loaded',{component:'Tradeables'});
HG.vent.trigger('component:loaded',{component:'TradeablesView'});