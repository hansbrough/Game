/*--- Balance Boards ---*/
//Model for a Balance Board
HG.Balance = Backbone.Model.extend({
	defaults: {
	  'id': null,
		'stageIdx': 5, 
	  'name': '',
		'currentStage': null,
	  'description': '',
	  'aftermath':{},	
		'listen':{},	
		'range': 11,//number of dice rollTotals (for 2 x 6 sided)
		'stages': ['terminal','critical','severe','warning','caution','neutral','caution','warning','severe','critical','terminal'],
		'sides': ['left','right'],
		'type':null,
		'variety':null
	}
});

HG.BalanceBoards = Backbone.Collection.extend({
	model: HG.Balance,
	url:'model/balance.json',
	//localStorage: new Backbone.LocalStorage("HG"),
	localStorage:true,
	currentStage: null,
	
	initialize: function(){
		//console.log("initialize BalanceBoards");	
	  _.bindAll(this,'handleStageIdxChange','_fetch');
		this.on('change:stageIdx',this.handleStageIdxChange,this);
	},
	_fetch: function(){
		//console.log("Balance _fetch");
		this.fetch({
	    success: this.fetchSuccess,
	    error: this.fetchError
	  });
	},
	fetchSuccess: function (collection, response) {
		//console.log("Balance fetchSuccess collection: ",collection);
		HG.vent.trigger('component:data-loaded',{component:'Balance'});
		//Initiate the custom event listeners for each collection model
		//e.g. the British Diplomacy board listens to several events including 'CV-08:confederate:win'
		collection.each(function(model,index){
			collection.setListeners(model);
		});
		//console.log("fetchSuccess: this: ",response);
  },
  fetchError: function (collection, response) {
  	throw new Error("Balance fetch error");
  },
	broadcast: function(Board){
		//console.log("Balance broadcast for board:",Board);
		var stage					= Board.get('currentStage'),
				type					= Board.get('type'),
				variety				= Board.get('variety'),
				side					= this.getCurrentSide(Board),
				bId						= Board.get('id'),
				event_string	= 'balance:'+type+':'+variety+':'+stage+':'+side;
				console.log("...event_string:",event_string);
		HG.vent.trigger(event_string,{id:event_string, board:bId});
	},
	//get the name of the side to which balance has shifted.
	getCurrentSide: function(Board){
		//console.log("Balance getCurrentSide");
		var side,
				sideIdx,lower,upper,
				sides			= Board.get('sides'),
				stageIdx	= Board.get('stageIdx')+1,
				range			= Board.get('range'),
				quotient	= (stageIdx / range);
		
		upper = HG.inRange(.6, 1, quotient);
		lower = HG.inRange(0, .5, quotient);
		sideIdx = ( lower ) ? 0 : ( (upper) ? 1 : null );
		side = (sideIdx !== null)?sides[sideIdx]:'';
		
		return side;
	},
	getNext: function(direction){
		currentIdx = _.indexOf(this.stages, this.current);
		currentIdx++; 
		return this.stages[currentIdx];
	},
	//Move the Board's balance in response an event e.g. "CV-08:confederate:win"
	handleBroadcast: function(evt){
		//console.log("Balance handleBroadcast evt:",evt);
		//look up the the event name and figure out what to do...
		var action = this.get('listen')[evt.id];
		//console.log("... action:",action);
		this.collection.incrementCurrentStageIdx(this, action);
	},
	handleStageIdxChange: function(evt){
		//console.log("Balance handleStageIdxChange evt:",evt);
		this.setCurrentStage(evt);//keep current stage name in sync w/index
		this.broadcast(evt);
	},
	setCurrentStage: function(Board){
		//console.log("setCurrentStage: Board.name:",Board.get('name'));
		var stageList = Board.get('stages'),
				idx				= Board.get('stageIdx'),
				stageName	= stageList[idx];
				
		Board.set('currentStage',stageName);
		Board.save({'currentStage':stageName}, {patch: true}); 
	},
	//increment or decrement existing stage index based on 'val' argument
	//'val' arg expected to be 1, -1, 2 etc
	incrementCurrentStageIdx: function(Board, val){
		console.log("Balance incrementCurrentStageIdx for:",Board.get('name')," by ",val);
		var stageIdx 	= Board.get('stageIdx'),
				ceiling		= Board.get('range')-1;
		stageIdx += parseInt(val);
		stageIdx = (stageIdx>ceiling)?ceiling:stageIdx;//normalize ceiling
		stageIdx = (stageIdx<0)?0:stageIdx;//normalize floor
		Board.set('stageIdx',stageIdx);
		Board.save({'stageIdx':stageIdx}, {patch: true}); 
	},
	//set to a given value
	setCurrentStageIdx: function(Board, val){
		Board.set('stageIdx',val);
		Board.save({'stageIdx':val}, {patch: true});
	},
	//Look through a Balance Boards json definition and set up event listeners for each 'listen' entry.
	setListeners: function(Board){
		//console.log("setListeners for ",Board.get('id'));
		var listenees = Board.get('listen');
		
		for(var l in listenees){
			listenee	= l,
			action		= listenees[l];
			//console.log("... listening to: ",listenee," with aftermath action: ",action);
			HG.vent.on(listenee, this.handleBroadcast, Board);
		}
		
	}

});

HG.vent.trigger('component:loaded',{component:'BalanceBoards'});