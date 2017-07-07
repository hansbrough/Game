/*--- Messaging ---*/
//messages put into a queue, sorted and run after a short delay.
//in an attempt to accomodate multiple messages. 

//Model for a Message
HG.Message = Backbone.Model.extend({
	defaults: {
      'id': null
	}
});

//Collection of Messages
HG.Messages = Backbone.Collection.extend({
	model: HG.Message,
	url: 'model/messaging.json',
	timeoutID: null,
	
	initialize: function(){
	  this.fetch({
	    success: this.fetchSuccess,
	    error: this.fetchError
	  });
	},
	fetchSuccess: function (collection, response) {
    //console.log('Messages Collection fetch success', response);
    //console.log('Messages Collection models: ', collection.model);
  },

  fetchError: function (collection, response) {
    throw new Error("fetch error");
  }
});

HG.MessagesView = Backbone.View.extend({
    el: $('.message'),
		$house: $('.message-house'),
		$houseText: $('.message-house .message-content'),
		queue:[],
		addToQueue: function(config){
			//console.log("addToQueue");
			this.queue.push(config);
			//order events ... 'append's go after 'show's
			this.queue.sort(function(a,b){
				var order;
				if(a.type === 'show' && b.type === 'append'){
					order = -1;
				}else if(a.type === 'append' && b.type === 'show'){
					order = 1;
				}else{
					order = 0;
				}
				return order;
			});
			//console.log('... queue: ',this.queue);
			//delay for some time to allow for other events being queued
			this.timeoutID = window.setTimeout(this.runQueue, 400);
		},
		//run events in the queue
		runQueue: function(){
			//console.log('runQueue');
			var len = this.queue.length,
					msg;
			for(var i = 0;i<len;i++){
				msg = this.queue[i];
				switch(msg.type){
					case 'show':
						this.render(msg.id, msg.context);
						break;
					case 'append':
						this.append(msg.id, msg.context);
						break;
					default:
						console.log('...no matching message type');
						break;
				}
			}
			this.clearQueue();
			window.clearTimeout(this.timeoutID);
		},
		clearQueue: function(){
			//console.log('clearQueue');
			this.queue = [];
		},
		animate: function(msgId, context){
			//console.log("animate");
			var msgObj 	= this.collection.findWhere({id:msgId}),
					path		= msgObj.get('template'),
					$el 		= this.$houseText; //hardwired to house msg box ... todo: more than one msg box?
					
			HG.getTemplate(path, function(template){
				$el.html(template( {message: context} ));
			});
					
			this.$house.animate({top:100}, 1000, function(){
				$(this).delay(2000).animate({top:-200});
			});
		},
		append: function(msgId, context){
			//console.log("Messaging append: ",msgId, context);
			var msgObj 	= this.collection.findWhere({id:msgId}),
					path		= msgObj.get('template'),
					$el 		= this.$el;
					
			HG.getTemplate(path, function(template){
				$el.append(template( {message: context} ));
			});

		  return this;			
		},
		//Look up template path and render it with the supplied context
    render: function(msgId, context){
			//console.log("Messaging render: ",msgId);
			var msgObj 	= this.collection.findWhere({id:msgId}),
					path		= msgObj.get('template'),
					$el 		= this.$el;

			HG.getTemplate(path, function(template){
				$el.html(template( {message: context} ));
			});
			
      return this;  
    },
		initialize: function(){
			//console.log('MessagesView:',this)

			//Subscribe to custom events
			_.bindAll(this,'runQueue');
		  //HG.$el.on('newcard',this.handleNewCard);			
		}
});

HG.vent.trigger('component:loaded',{component:'Messages'});
HG.vent.trigger('component:loaded',{component:'MessagesView'});