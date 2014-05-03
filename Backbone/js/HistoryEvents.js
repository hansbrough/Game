/*--- History Events ---*/
//Model for an Historic Event 
HG.Event = Backbone.Model.extend({
	defaults: {
      'id': null,
      'name': '',
      'description': '',
      'event_ability_total': 0,
      'ability':{},
      'aftermath': '',
      'requires': null,
			'overview': null,
			'thumbnail':null,
      'type': ''
	}
});

//Collection of Events
HG.Events = Backbone.Collection.extend({
	model: HG.Event,
	url:'model/events.json',
	current: null,
	eventIndex: null,
	playOrder: [
    "CV-01","CV-02","CV-05","CV-09","CV-10"
  ],
	
	initialize: function(){
		_.bindAll(this,'handleEventSuccess');
		//Subscribe to custom events
		HG.vent.on('game:event-success', this.handleEventSuccess);
		
	  this.fetch({
	    success: this.fetchSuccess,
	    error: this.fetchError
	  });
	},
	
	fetchSuccess: function (collection, response) {
		//Initiate the custom event listeners for each collection model
		//e.g. the British Diplomacy board listens to several events including 'CV-08:confederate:win'
		collection.each(function(model,index){
			collection.setListeners(model);
		});
  },

  fetchError: function (collection, response) {
    throw new Error("fetch error");
  },
	//run a set of actions associated with the aftermath of a history event
	aftermath: function(completedEvent){
		//console.log("HistoryEvent aftermath: ",completedEvent);
		//console.log(".... action ",completedEvent.evt.get('action'));
		var winner 	= completedEvent.winner,
				looser	=	completedEvent.looser,
				evt			= completedEvent.evt,
				action	= evt.get('action'),
				type		= evt.get('type'),
				path		= winner.get('affiliation'),
				directions,len,commands;
				
		//look up directions for normal events vs catalysts
		directions	= ( type === 'event' ) ? action[path] : action[type];
		commands 		= this.createCommands(directions);
		
		this.runCommands(commands);
		
	},
	//Trigger a custom event based on something that happended during a History Event e.g. a win
	broadcast: function(config){
		console.log('Events broadcast:',config);
		var type 	= config.type,
				hEvt	= config.evt,
				affiliation,evtId,broadcastStr;
		
		if(type==='success'){
			affiliation = hEvt.winner.get('affiliation');
			evtId				= hEvt.evt.get('id');
			broadcastStr	= evtId+':'+affiliation+':win';
			console.log("...",broadcastStr);
			HG.vent.trigger(broadcastStr,{id:broadcastStr,evt:hEvt});//note:sending event name as part of payoad because it's not accessible to the listener
		}
		
	},
	//turn a pattern language string into a corresponding object
	createCommands: function(directions){
		//console.log("HistoryEvents - createCommands directions:",directions);
		var command,
				commands		= [],
				components	= ['subject','verb','object','determiner','adjective_type','adjective_qualifier'],
				len					= directions.length,
				direction;
				
		while(len--){
			direction = directions[len].split(':');
			command		= this.getCommandTmpl();
			for( var i = 0; i<direction.length; i++){
			  command[ components[i] ] = direction[i];
			}
			commands.push(command);
		}
		
		return commands;		
	},
	createRequirementCommands: function(directions){
		//todo: possibly combine this with createCommands since it's largely a copy paste.
		//since been refactored using 'parseCommands' - can use that in createCommands as well.
		//console.log("HistoryEvents - createRequirementCommands directions:",directions);
		var commands		= [],
				commandGrp	= [],
				grammar			= ['object','determiner','adjective_type','adjective_qualifier','amount'],
				getTmpl			= this.getRequiresTmpl,
				len					= (directions)?directions.length:0,
				direction,bool_directions;
				
		while(len--){
			bool_directions = directions[len].split('|');//look for boolean OR declarations in directions
			if(bool_directions.length > 1){//if found bundle together
				_.each(bool_directions, function(item){
					commandGrp.push( this.parseCommands(item, grammar, getTmpl) );
				},this);
				commands.push(commandGrp);
			}else{
				command = this.parseCommands(directions[len], grammar, getTmpl);
				commands.push(command);
			}
		}
		
		return commands;		
	},
	//convert a single set of directions into a command
	parseCommands: function(direction, grammar, getTmplMethod){
		var command;	
		direction = direction.split(':');
		command			= getTmplMethod();//get a blank command
		for( var i = 0; i<direction.length; i++){//populate the command from direction components
	  	command[ grammar[i] ] = direction[i];
		}		
		return command;
	},
	getCommandTmpl: function(){
		return {'subject':null,'verb':null,'object':null,'determiner':null,'adjective_type':null,'adjective_qualifier':null};
	},
	getRequiresTmpl: function(){
		return {'object':null,'determiner':null,'adjective_type':null,'adjective_qualifier':null,'amount':null};
	},
	//Get the next history event card
	getNext: function(){
		var evtIdx  = this.eventIndex || 0,
		    cardId  = this.playOrder[evtIdx],
		    card    = this.findWhere( {id:cardId} );
		//console.log("HistoryEvents collection getNext: ",evtIdx, cardId, card);
		//this.eventIndex = evtIdx;//todo:make this a setter call
		this.setEventIndex(evtIdx);
		return card;
	},
	getIsInPlay: function(){
		return this.current;
	},
	handleEventSuccess: function(evt){
		console.log("HistoryEvents - handleEventSuccess", evt);
		this.aftermath(evt);
		this.setEventIndex(this.eventIndex+1);
		this.setInPlay(null);
		this.broadcast({type:'success',evt:evt});
	},
	handleBroadcast: function(evt){
		//console.log("History Event handleBroadcast evt:",evt);
		//note: context here is set the listening History Event - not the larger collection
		//look up the the event name and figure out what to do...
		var action = this.get('listen')[evt.id];
		//console.log("... action to execute:",action);
		//this.collection.setCurrentStageIdx(this, action);
		//todo: play event
		switch(action){
			case 'play':
				HG.component.Events.setInPlay(this);
				break;
			default:
				break;
		}
	},
	//parse direction string into components and run the appropriate 'verb' function
	runCommands: function(commands){
		//console.log("Events runCommands:",commands);
		var len = commands.length,
				command, subject, verb, object, determiner, type, qualifier,
				card;
		
		while( len-- ){
			command 		= commands[len];
			subject 		= this.getCommandSubject(command.subject);
			
			object			= this.getCommandObject(command.object, subject);
			type				= command.adjective_type;
			qualifier		= command.adjective_qualifier;
			determiner	= command.determiner;
			verb				= this.getCommandVerb(command.verb, subject, command.adjective_type, qualifier, determiner);
			
			//console.log("... subject: ",subject.get('name'), ' and determiner: ', determiner);
			verb();			
		}
	},
	//return a function (closure) representing the action to run
	getCommandVerb: function(verbStr, subject, type, qualifier, determiner){
		var verb = null;
		
		switch(verbStr){
			case 'draw':
				//console.log("... case draw");
				if( type === 'character'){
					//find the next character with an ability type == qualifier (e.g. political character card)
					verb = function(){
						var card = HG.getCharacterCard({user:subject,ability:qualifier,affiliation:true	});
						if(card){//not always enough cards with correct ability
						  HG.vent.trigger('newcard',{'card':card, 'username':subject});
						}
						return card;
					}
				}else if( subject.get('type') === 'player'){
					//find a random card with ability of type == qualifier
					verb = function(){
						while(determiner--){
						  var card = HG.getResourceCard({type:qualifier});
							//console.log(".... card: ",card);
							if( card ){
							  HG.addCardToUsersDeck(type, card, subject);
							}
						}
					}
				}
				break;
			case 'add':
				//console.log("... case add");
				verb = function(){
				  HG.putCharacterAbility(subject,{ability:qualifier,amount:determiner});
				}
				break;
			case 'block':
				//console.log("... case block");
				verb = function(){
					if(subject.get('type') === 'player'){
					  HG.putUserBlocked(subject, type, qualifier, determiner);
					}
				}
				break;				
			case 'subtract':
				//subtract points from a card
				//console.log("... case subtract");
				verb = function(){
			  	HG.deleteCharacterAbility(subject,{ability:qualifier,amount:determiner});
				}
				break;
			case 'remove':
				//remove resource cards
				//console.log("... case remove");
				verb = function(){
					if(subject.get('type') === 'player'){
						while(determiner--){
					  	HG.removeCardFromUserModelByAbility({user:subject, type:'resource', ability:qualifier});
						}
					}
				}
				break;
			default:
				//console.log("... case default");
				break;
		}
		return verb;
	},
	//given an identifying string - return an object that will serve as the subject of a command.
	getCommandSubject: function(subjectStr){
		//console.log("getCommandSubject:",subjectStr);
		var subject = null,
				usersCharacter,
				othersCharacter;
		if(subjectStr === 'union' || subjectStr === 'confederate'){//Player
			subject = HG.getUserByAffiliation(subjectStr)
		}else if( /[CURPMSEI]{2}-\d{2}/.test(subjectStr) ){//Character Card
			usersCharacter = HG.getCurrentUser().get('cards').character.findWhere({id:subjectStr});
			othersCharacter = null;//todo: determine 'other' player
			if( usersCharacter ){
				subject = usersCharacter;
			}else if(false){
				//other user who is not currently playing
				subject = othersCharacter;
			}else{//not yet dealt to a player
				subject = HG.component.Characters.findWhere({id:subjectStr});
			}
		}
		return subject;
	},
	getCommandObject: function(objStr, subject){
		var object 				= null;
		
		switch(objStr){
			case 'card':
				object	= ( subject.get ) ? subject.get('cards'):null;
				break;
			case 'player':
			
				break
			default:
				break;
		}
		return object;
	},
	//Determine variety of event based on greatest ability required to complete event
	getVariety: function(evt){
		//console.log("Events getVariety() evt:",evt);
		var variety,ability
				greatest = 0;

		if(evt){
			evt			= (evt.get)?evt:this.findWhere({id:evt}),
			ability	= evt.get('ability');
			//console.log("Events getvariety() ability:",ability);
			for(var i in ability){
				if( ability[i] > greatest ){
					greatest 	= ability[i];
					variety		= i;
				} 
			}
		}
		return variety;
	},
	//are the requirements met for a given event so that a user can start play
	requirement: function(evt, user){
	  //console.log("HistoryEvents requirement: ",evt);
		var evt 							= (evt.get) ? evt : this.findWhere({'id':evt}),
				requirements 			= evt.get('requires'),
				meetsRequirement	= false,
				affiliation				= user.get('affiliation'),
				directions,len,commands,
				direct_object,type,qualifier,amount,command;
				
		//console.log('... requirements ',requirements);
		if(requirements){
			directions 	= requirements[affiliation];
			commands 	 	= this.createRequirementCommands(directions);
			len					= commands.length;
			//console.log("...commands:",commands);
			//if a given affiliation has no commands then they meet the requirement
			if(len === 0){
				meetsRequirement = true;
			}
			while(len--){
				command = commands[len];
				meetsRequirement = this.decomposeCommandsAndGetUserHasRequirement(user, command);
				if(meetsRequirement){
					break;//no need to look further if requirement met
				}
			}
		}else{
			//if there are no requirements then they are easy to meet ;)
			meetsRequirement = true;
		}
		//console.log("HistoryEvents requirement: ",meetsRequirement);
		return meetsRequirement;
	},
	//determine if a user has a requirements in a list of equally acceptable commands (or a single command)
	decomposeCommandsAndGetUserHasRequirement: function(user, command){
		//console.log("Events - decomposeCommandsAndGetUserHasRequirement:",command);
		var meetsRequirement;
		if(_.isArray(command) ){
			//console.log('... found an array of boolean OR requirements');
			for(var i = 0; i<command.length;i++){
				//console.log("....checking",command[i]);
				meetsRequirement = this.hasRequirement(user,command[i]);
				if(meetsRequirement){
					break;//if any requirement is met in this group - no need to look further.
				}
			}
		}else{//test an individual requirement command
			meetsRequirement = this.hasRequirement(user, command);
		}
		return meetsRequirement;
	},
	//given a user and a single requirement command - determine if requirement can be met.
	hasRequirement: function(user, command){
		//console.log("hasRequirement:",command);
		var direct_object = command.object,
				type					= command.adjective_type,
				qualifier			= command.adjective_qualifier,
				amount				= command.amount,
				determiner		= command.determiner,
				met,candidates;
		if( /[CURPMSEI]{2}-\d{2}/.test(direct_object) ){//a specific card (id) 
			//met = !!_.findWhere( user.get('cards')['resource'], {id:direct_object} );
			met = (_.where( user.get('cards')['resource'], {id:direct_object} ).length >= determiner);
			//console.log("...does user have: ",determiner," ",direct_object,"? :",met);
		}else if( direct_object === 'card' ){
			//console.log("... requires a non specific card:",type, qualifier, amount);
			met = HG.getUserHasCard({user:user,	determiner:determiner, type:type, ability:qualifier, amount:amount});
		}
		//console.log("... met:",met);
		return met;
	},
	//set the event in play and event progress idx. called when a game session restarts.
	resetEventsInPlay: function(user, progressIdx, evtInPlay){
		//console.log("resetEventsInPlay:",user, progressIdx, evtInPlay);
		this.setEventIndex(progressIdx);
		if(evtInPlay){
			this.setInPlay(evtInPlay);
		}
	},
	//Attempt to mark next event in play if no event is already in play.
	//Return boolean indicating if next event was put into play.
	setNextInPlay: function(){
    console.log('Events: setNextInPlay');
		var next = null;
		if( !this.current ){
      next = this.getNext();
			this.setInPlay(next);
		}
		return (next) ? true: false;
  },
	setInPlay: function(evt){
		//console.log("Events setInPlay evt:",evt);
		var card;
		if(evt){
			card = (typeof evt === 'object')? evt: this.findWhere( {id:evt} );
		}else{
			card = null;//assume any falsy value means no event is in play.
		}
		
		this.current = card;
		//notify any listeners that the current event or record has changed.
		HG.vent.trigger('events:change:current',{card: this.current});
	},
	setEventIndex: function(val){
		//console.log("setEventIndex val:",val);
		this.eventIndex = val;
		HG.vent.trigger('events:change:progess',{eventIdx: this.eventIndex});//notify any listeners
	},
	//Look through a History Events json definition and set up event listeners for each 'listen' entry.
	setListeners: function(Event){
		//console.log("setListeners for ",Board.get('id'));
		var listenees = Event.get('listen');
		
		for(var l in listenees){
			listenee	= l,
			action		= listenees[l];
			//console.log("... listening to: ",listenee," with aftermath action: ",action);
			HG.vent.on(listenee, this.handleBroadcast, Event);
		}
		
	},
	debugSetEvent: function(eventId){
		var card			= this.findWhere( {id:eventId} );
		//this.current	= card;
		this.setInPlay(card);
		//console.log("debugSetEvent current:",this.current);
		HG.vent.trigger('events:change:current',{card: this.current});
	}
	
});

HG.EventsView = Backbone.View.extend({
    el: $('.event.cards'),
		remove: function(){
			console.log("EventsView remove ...time to hide the event");
			HG.$el.removeClass('event-in-play');
		},
    render: function(history_event){
		  //console.log('Render a History Event:',history_event);
			var $el = this.$el;
			history_event = history_event || this.collection.current.toJSON();//render passed in list or default to collection contents
			HG.getTemplate('js/templates/history_event.tmpl', function(template){
				$el.html(template( {'historic_event': history_event} ));
			});
			HG.$el.addClass('event-in-play');
      return this;  
    },
		initialize: function(){
			//console.log('EventsView:',this)
			//Subscribe to Collection events
		  //this.collection.on("change:current", this.handleNewEventInPlay, this);

			//Subscribe to custom events
			_.bindAll(this,'handleNewEventInPlay');
		  HG.vent.on('events:change:current',this.handleNewEventInPlay);			
		},
		//What the view should do when a new history event is set in play
		handleNewEventInPlay: function(evt){
	    //console.log('Events view handleNewEventInPlay evt:',evt);
			if(evt.card){
	    	this.render();
			}else{
				this.remove();
			}
	  }
		
});

HG.vent.trigger('component:loaded',{component:'Events'});
HG.vent.trigger('component:loaded',{component:'EventsView'});
