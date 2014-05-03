/*--- Resources ---*/
//Model for a Resource
HG.Resource = Backbone.Model.extend({
	defaults: {
	  'id': null,
	  'name': '',
	  'headline': '',
	  'affiliation': '',
	  'ability':{},
	  'rarity':'',
	  'type': 'resource'
	}
});

//Collection of Resources
HG.Resources = Backbone.Collection.extend({
	model: HG.Resource,
	url:'model/resources.json',
	
	initialize: function(){
	  this.fetch({
	    success: this.fetchSuccess,
	    error: this.fetchError
	  });
	},
	fetchSuccess: function (collection, response) {
  	//console.log('Collection fetch success', response);
  	//console.log('Collection models: ', collection.model);
   },
   fetchError: function (collection, response) {
   	throw new Error("Resources fetch error");
   }	
});

HG.ResourcesView = Backbone.View.extend({
    el: $('.resource.cards'),
		myType:'resource',
		collection: HG.Resources,
		resourcePool:{},
		//Add a single card to the existing view of cards
		append: function(card){
			//console.log("ResourcesView... append: ",card);
			var $el 	= this.$el,
					card 	= (card.toJSON) ? card.toJSON(): card;
			
			HG.getTemplate('js/templates/resource.tmpl', function(template){
				$el.append(template( {resources: card} ));
			});
			
      return this;
		},
    render: function(resourcelist){
			var $el 	= this.$el;
		  //console.log('Resources: render a resourcelist:', resourcelist);
      resourcelist = (resourcelist) ? resourcelist: this.collection.toJSON();//render passed in list or default to collection contents
			//below can be run from async jquery request to grab an individual template file instead of an inline script tag
			//http://www.jblotus.com/2011/05/24/keeping-your-handlebars-js-templates-organized/
      //var template = Handlebars.compile( $("#resource-template").html() );
      //$(this.el).html(template( {resources: resourcelist} ));

			HG.getTemplate('js/templates/resource.tmpl', function(template){
				$el.html(template( {resources: resourcelist} ));
			});
			
      return this;  
    },
		initialize: function(){
			//Subscribe to custom events
			_.bindAll(this,'handleNewCard', 'handleTradeModuleStart','getPumpResource','drawCard');
		  HG.vent.on('newcard',this.handleNewCard);
		  HG.vent.on('module:trade',this.handleTradeModuleStart);			
			
		},
		//Determine if we should restart the resource pump when a model change:power event occurs
		//do so if users score has passed the next threshold or their greatest ability has changed.
		evaluateResourcePump: function(user){
			//console.log('evaluateResourcePump');
			//console.log('...previous: ',user.previous('power'));
			//console.log('...current: ',user.get('power'));
			var current 	= user.get('power'),
					previous	= user.previous('power');
			if(current && previous){
				if(current.title !== previous.title){
					this.restartResourcePump(user);
				}else if( this.getResourceInterval(current.score) !== this.getResourceInterval(previous.score) ){
					this.restartResourcePump(user);
				}else{
					//console.log("... not enough changed");
				}
			}
		},
		//every n minutes generate resource cards based on a player's greatest ability
		//optional user arg - defaults to current user
		//reset timer once the greatest ability changes.
		startResourcePump: function(user){
			//console.log("startResourcePump");
			var username			= (user) ? user.get('name') : HG.getCurrentUserName(),
					abilityObj 		= HG.getUserGreatestAbility(username),
					ability				= abilityObj.title,
					score					= abilityObj.score,
					interval			= this.getResourceInterval(score) || 360000,
					_getResource	= this.getPumpResource,
					timer 				= HG.timerFactory( function(){
						console.log('timer cb for: ',username," at an interval of: ",interval);
						var abilityType = _.shuffle( HG.getAbilityTuples[ability]).pop(),
								card 				= _getResource(username, abilityType);
						HG.addCardToUsersDeck('resource', card, username);
					}, interval);

			this.resourcePool[username] = timer;
		},
		stopResourcePump: function(user){
			//console.log("stopResourcePump");
			var username			= (user) ? user.get('name') : HG.getCurrentUserName();
			clearInterval(this.resourcePool[username]);
		},
		restartResourcePump: function(user){
			//console.log("restartResourcePump");
			this.stopResourcePump(user);
			this.startResourcePump(user);
		},
		//get a resource tied to user's greatest ability
		//e.g. political ability may generate political and social cards (alt type not built yet)
		getPumpResource: function(username, ability){
			//console.log("getPumpResource");
 			return this.drawCard({rarity:'common',type:ability});
		},
		//Based on an ability score - find the corresponding ms interval used to retrieve resources.
		getResourceInterval: function(score){
			//console.log("getResourceInterval");
			var intervals = HG.getResourceIntervals(),
					interval	= null,
					min,max;
			for(var i in intervals){
				min = intervals[i][0];
				max = intervals[i][1];
				if( HG.inRange(min, max, score) ){
					interval = parseInt(i);
					break;
				}
			}
			return interval;
		},
		//Draw/Pick a random resource card
		//optionally filter request by rarity and type
		drawCard: function(config){
			//console.log("drawCard: ",config);
			var config 	= config || {},
					rarity	= config.rarity || 'common',
					type		= config.type || null,
					card 		= null,
					cards 	= HG.component.Resources.filter(function(item){
											var rarityMatch = (item.get('rarity') === rarity),
													typeMatch		= (type) ? (item.get('ability')[type]) : true;//type is optional
			  							return ( rarityMatch && typeMatch);
										});
			
			cards = _.shuffle( cards );
			card  = cards.pop();
			//console.log("drawCard: ",card)
		  
			return card;
		},
		//What the view should do when a new card is drawn/picked
		//but House cards should not be appended to the User's cards.
		handleNewCard: function(evt){
	    //console.log('ResourcesView handleNewCard: ',evt);
			var cardType 	= (evt.card.get)?evt.card.get('type'):evt.card.type,
					cardAbility, abilityLabel,
					cardsUser	= evt.username,
					gameState	= HG.getState();
			//console.log('... type:',cardType,'==',this.myType)
			//console.log('... gameState:',gameState);
		  if( gameState != 'first-turn' &&  cardType === this.myType){
				//console.log("...found resource card: ",evt.card);
				//console.log("...",cardsUser,"===",HG.House.get('name'));
				if( cardsUser === HG.House.get('name') ){
					cardAbility	= (evt.card.get) ? evt.card.get('ability') : evt.card.ability;
					for(var a in cardAbility){
						abilityLabel = a;
						break;
					}
					HG.animateMessage('house_new_card',{name:cardsUser, 'newCardType':cardType, ability:abilityLabel});
				}else{
					this.append(evt.card);
				}
			}
	  },
		handleTradeModuleStart: function(){
			//console.log("Resources: HandleTradeModuleStart");
			this.$el.children('li').draggable({ snap: '#trading-well','cursor':'pointer' });
		}
});

HG.vent.trigger('component:loaded',{component:'Resources'});
HG.vent.trigger('component:loaded',{component:'ResourcesView'});
