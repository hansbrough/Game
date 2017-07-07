//localStorage.clear();//nope - breaks stuff
//Unit tests for the History Game
describe("The 'History Game'", function() {
	//setting up some common values
	var Events 							= HG.component.Events,
			Characters					= HG.component.Characters,
			Players							= HG.component.Players,
			GameView						= HG.component.GameView,
			HarrietBeecherStowe,
			WaltWhitman,
			SalmonPChase,
			MaryBoykinChesnut,
			CharlesSumner,
			UlyssesSGrant,
			NathanBedfordForrest,
			Bookpublisher				= {
			  "id": "CR-12",
			  "name": "Book Publisher",
			  "ability":{
			    "social": 3
			  },
			  "type": "resource",
			  "rarity": "common"
			},
			Congressman = {
			  "id": "CR-06",
			  "name": "U.S. Congressman",
			  "ability":{
			    "political": 5
			  },
			  "type": "resource",
			  "rarity": "common"
			},
			Abolitionist = {
		   "id": "CR-09",
		    "name": "abolitionist",
		    "ability":{
		      "social": 1
		    },
		    "type": "resource",
		    "rarity": "common"
			},
			FactoryWorker = {
		    "id": "CR-13",
		    "name": "Factory Worker",
		    "ability":{
		      "industrial": 1
		    },
		    "type": "resource",
		    "rarity": "common"
		  },
			SmallManufacturer = {
		    "id": "CR-17",
		    "name": "Small Manufacturer",
		    "ability":{
		      "industrial": 10
		    },
		    "type": "resource",
		    "rarity": "common"
		  },
			Building = {
		    "id": "CR-21",
		    "name": "Building",
		    "ability":{
		      "industrial": 2
		    },
		    "type": "resource",
		    "rarity": "common"
		  },
			GoldBar = {
		    "id": "UR-12",
		    "name": "Gold Bar",
		    "ability":{
		      "political": 3
		    },
		    "type": "resource",
		    "rarity": "uncommon"
		  };
			
	describe("Check components", function() {
	
	  it("should have an HG namespace", function() {
	    expect(HG).toBeDefined();
	  });

	  it("should have a mediator object for working with custom events", function() {
	    expect(HG.vent.trigger).toBeDefined();
	  });

	  it("should have BalanceBoards component", function() {
	    expect(HG.component).toBeDefined();
			expect(HG.component.BalanceBoards).toBeDefined();
	  });
	
	  it("should have Character components", function() {
	    expect(HG.component).toBeDefined();
			expect(HG.component.Characters).toBeDefined();
			expect(HG.component.CharactersView).toBeDefined();
	  });

	  it("should have Event components", function() {
	    expect(HG.component).toBeDefined();
			expect(HG.component.Events).toBeDefined();
			expect(HG.component.EventsView).toBeDefined();
	  });

	  it("should have a GameView component", function() {
	    expect(HG.component).toBeDefined();
			expect(HG.component.GameView).toBeDefined();
	  });

	  it("should have InfluenceCards components", function() {
	    expect(HG.component).toBeDefined();
			expect(HG.component.InfluenceCards).toBeDefined();
			expect(HG.component.InfluenceCardsView).toBeDefined();
	  });

	  it("should have Messages components", function() {
	    expect(HG.component).toBeDefined();
			expect(HG.component.Messages).toBeDefined();
			expect(HG.component.MessagesView).toBeDefined();
	  });

	  it("should have Players components", function() {
	    expect(HG.component).toBeDefined();
			expect(HG.component.Players).toBeDefined();
			expect(HG.component.PlayersView).toBeDefined();
	  });

	  it("should have Resources components", function() {
	    expect(HG.component).toBeDefined();
			expect(HG.component.Resources).toBeDefined();
			expect(HG.component.ResourcesView).toBeDefined();
	  });

	  it("should have Tradeables components", function() {
	    expect(HG.component).toBeDefined();
			expect(HG.component.Tradeables).toBeDefined();
			expect(HG.component.TradeablesView).toBeDefined();
	  });

	  it("should have WildCards components", function() {
	    expect(HG.component).toBeDefined();
			expect(HG.component.WildCards).toBeDefined();
			expect(HG.component.WildCardsView).toBeDefined();
	  });

		describe("The Game comes with players", function() {
			beforeEach(function(done) {
			    setTimeout(function() {
			      value = 0;
			      done();
			    }, 1000);
			});
		
		  it("should have a 'house' and 'loggedin' player", function() {
				//console.log("HG.User:",HG.User)
		    expect(HG.User).not.toBeNull();
				expect(HG.House).not.toBeNull();
		  });
		});
	});

	describe("Setting up", function() {
	
		it("should assign a card pack to each player", function() {
			HG.User.get('cards').character = HG.component.Characters.createCardPack();
			HG.House.get('cards').character = HG.component.Characters.createCardPack();
			expect(HG.User.get('cards').character.length).toEqual(10);
			expect(HG.House.get('cards').character.length).toEqual(10);
		});
	
		it('should let player pick two cards from the pack',function(){
			var cards = HG.User.get('cards').character,
					unionCards = cards.where({'affiliation':'union'});
				
			for(var i = 0;i<2;i++){
				if(typeof unionCards[i] !== undefined){
					unionCards[i].set('inhand',true);
				}
			}
		
			expect( cards.where({inhand:true}).length ).toEqual(2);
		});
	
		it('should assign player an affiliation',function(){
			HG.User.set('affiliation', 'union');
			expect( HG.User.get('affiliation') ).toEqual('union');
		});
	
		it('should set players ability totals',function(){
			HG.setUserAbilities();
			expect(HG.User.get('abilities').espionage).toBeDefined();
		});
	
		it('should set players event range',function(){
			expect(HG.User.get('eventRange')).toEqual([7,12]);
		});
	
		it('should assign default RESOURCE cards to User',function(){
			//do some stuff only once after player has picked initial cards.
			HG.component.GameView.assignDefaultResources();
			expect( HG.User.get('cards').resource.length ).toBeGreaterThan(0);
		});
	
		it('should assign default INFLUENCE cards to User',function(){
			//do some stuff only once after player has picked initial cards.
			HG.component.GameView.assignDefaultInfluence();
			expect( HG.User.get('cards').influence.length ).toBeGreaterThan(0);
		});
	
		it('should set up House player',function(){
			console.log("!!!!!!!!!! it should set up House player");
			HG.component.Players.setUpHouse();
			var cards = HG.House.get('cards');
		
			expect(HG.House.get('abilities').espionage).toBeDefined();
			expect( cards.character.where({inhand:true}).length ).toEqual(2);
			expect( HG.House.get('affiliation') ).toEqual('confederate');
			expect( cards.resource.length ).toBeGreaterThan(0);
			expect( cards.influence.length ).toBeGreaterThan(0);
			expect( HG.House.get('eventRange') ).toEqual([2,7]);
		
			//Tear Down
			//but... we want to control for which characters the house will play
			//because we need predictinbility of later tests - so swap characters.
			var cardsInhand = HG.House.get('cards').character.where({inhand:true});
					len 				= cardsInhand.length;
			for(var i =0;i<len;i++){
				cardsInhand[i].set('inhand',false);
			}
			console.log("...house cards in hand",cards.character.where({inhand:true}).length);
			expect( cards.character.where({inhand:true}).length ).toEqual(0);
			//now add back some basic characters (they have no modifiers)
			var AlexanderHStephens 	= HG.component.Characters.findWhere({'id':'CP-01'}).clone(),
					RobertMTHunter			= HG.component.Characters.findWhere({'id':'CP-03'}).clone();
					AlexanderHStephens.set('inhand',true);
					RobertMTHunter.set('inhand',true);
					cards.character.push(AlexanderHStephens);
					cards.character.push(RobertMTHunter);
			//check they made it...
			//expect( cards.character.where({inhand:true}).length ).toEqual(2);
		});
		
		it("should tear down user characters", function(){
			//Tear Down
			//but... we want to control for which characters the User will play
			//because we need predictinbility of later tests.
			var cards				= HG.User.get('cards')
					cardsInhand = cards.character.where({inhand:true});
					len 				= cardsInhand.length;
			for(var i =0;i<len;i++){
				cardsInhand[i].set('inhand',false);
			}
			
			expect( cards.character.where({inhand:true}).length ).toEqual(0);
		})
	
	});

	describe("Event Basics.", function() {
		xit("should be able to set the next event in play",function(){
			Events.setNextInPlay();
			var firstEvent = Events.playOrder[0];
			expect(Events.current.get('id')).toEqual(firstEvent);
		});
	});
	
	describe("Event Rolls - character modifier use cases.", function() {

		describe("Unlock a Characters modifier", function() {
		
			beforeEach(function(done) {
			    setTimeout(function() {
			      value = 0;
			      done();
			    }, 1000);
			});
		
			xit("should change characters ability after adding 5 social ability points",function(){
				console.log("!!!!!!!!!! it should change characters ability after adding 5 social ability points");
				HarrietBeecherStowe = Characters.findWhere({'id':'RS-01'}).clone();
				//Add character with modifier to user's deck
				HarrietBeecherStowe.set('inhand',true);
			
				//Give Mrs. Stowe enough influence to unlock her modifier
				Characters.putAbility(HarrietBeecherStowe, {amount:5, ability:'social', characterId:'RS-01'});
			
				expect( HarrietBeecherStowe.get('ability_change').social ).toEqual(5);		
				//console.log("HarrietBeecherStowe.get('ability_change').social:",HarrietBeecherStowe.get('ability_change').social)
			
			});
		
			xit("should add HarrietBeecherStowe to the non-house player",function(){
				console.log("!!!!!!!!!! should add HBS to the non-house player");
				var inhandBefore = HG.User.get('cards').character.where({inhand:true}),
						inhandAfter;
				HG.User.get('cards').character.push(HarrietBeecherStowe);
				console.log("...User inhand characters after adding HBS",HG.User.get('cards').character.where({inhand:true}));
				inhandAfter = HG.User.get('cards').character.where({inhand:true})
				expect(inhandAfter).toBeGreaterThan(inhandBefore);
			})
		
			xit("should 'unlock' characters modifier once required ability condition is satisfied",function(){
				expect( HarrietBeecherStowe.get('unlocked').social ).toBeDefined();
			});
		
		});
	
		describe("Handle 'exceptional' event rolls e.g. Union > 12 or Confederate < 2", function() {
		
			beforeEach(function(done) {
			    setTimeout(function() {
			      value = 0;
			      done();
			    }, 1000);
			});
		
		  xit("should set next available event into play", function() {
				//console.log("!!!!!!!!!! should set next available event into play");
				Events.setNextInPlay();
				expect( Events.current.get('id') ).toEqual('CV-01');
			});

			xit("should add a resource to a player", function() {
				//console.log("!!!!!!!!!! should be able to add a resource to a player");
				var cardCntBefore = HG.User.get('cards').resource.length,
						cardCntAfter;
		
				//Add 1 social resource card to Hans (so he can meet CV-01 requirements later)
				Players.addCard('resource',Bookpublisher,'hans');
				cardCntAfter = HG.User.get('cards').resource.length;
				//console.log(cardCntBefore," < ",cardCntAfter);
				expect(cardCntAfter).toBeGreaterThan(cardCntBefore);
		  });
	
			xit("should roll a 12 for the current event in play", function() {
				console.log("!!!!!!!!!! should roll a 12 for the current event in play");
				//Max out the roll
				GameView.rollForEvent(null,{roll:12});
				//console.log("User event roll:",HG.User.get('eventRoll'));
		    expect( HG.User.get('eventRoll') ).toEqual(12);
			});
		
			xit("should give the bonus points to the character (HBS) with an unlocked modifier", function(){
				console.log("!!!!!!!!!! should give the bonus points to the character (HBS) with an unlocked modifier");
				//note that HarrietBeecherStowe previously had her 'ability_change' property set to 5 - now it should be greater
				expect( HarrietBeecherStowe.get('ability_change').social ).toBeGreaterThan(5);
			
				//TEAR DOWN
				HarrietBeecherStowe.set('inhand',false);
			});
		
		});

		describe("Account for multiple modifier conditions - e.g. 'CV-03|CV-09|military'",function(){
		
			xit("should set CV-03 event in play",function(){
				HG.component.Events.debugSetEvent('CV-03');
				expect( Events.current.get('id') ).toEqual('CV-03');
			});
		
			xit("should add Charles Sumner to Player card deck",function(){
				//console.log("!!!!!!!!!! it should add Charles Sumner to Player card deck");
				//Stack team with characters who have just the right modifiers
				CharlesSumner = HG.component.Characters.findWhere({'id':'CP-02'}).clone();
				CharlesSumner.set('inhand',true);
				HG.User.get('cards').character.push(CharlesSumner);

			});
		
			xit("should max roll for the event and see that Sumner got a bonus military ability point",function(){
				//console.log("!!!!!!!!!! it should roll for the event");
				//Max out the roll
				HG.component.GameView.rollForEvent(null,{roll:12});
				expect( CharlesSumner.get('ability_change').military ).toBeGreaterThan(0);
			});
		
		});
	
		describe("Check that character played with certain resources gets event balance bonus",function(){
			//Assumes Charles Sumner already in deck (if not he needs to be added)
			xit("should set CharlesSumner inhand",function(){
				CharlesSumner.set('inhand',true);
				//expect( ).toEqual();
			});
			
			xit("should set CV-02 event in play",function(){
				HG.component.Events.debugSetEvent('CV-02');
				expect( Events.current.get('id') ).toEqual('CV-02');
			});
		
			xit("should add 3 abolitionist resource cards", function(){
				//console.log("!!!!!should add 3 abolitionist resources");
				var cardCntBefore = HG.User.get('cards').resource.length,
						cardCntAfter,matching;

				for(var i=0;i<3;i++){
					Players.addCard('resource',Abolitionist,'hans');
				}
			
				cardCntAfter = HG.User.get('cards').resource.length;
				//console.log(cardCntBefore," < ",cardCntAfter);
				expect(cardCntAfter).toBeGreaterThan(cardCntBefore);
			});
		
			xit("should find matching characters w/bonus", function(){
				var found = false;
				matching = HG.component.Players.getResourceMatchingCharacters(HG.User,'resource','balance');
				//console.log("matching:",matching);
				for(var i=0;i<matching.length;i++){
					if(matching[i].id === 'CP-02'){
						found = true;
						break;
					}
				}
				expect(found).toEqual(true);
			});
		
			xit("should impact an event roll", function(){
				console.log("!!!!!should impact an event roll");
				HG.component.GameView.rollForEvent(null,{roll:10});
			
				var eventAdjusted = CharlesSumner.get('event_roll_adjusted');
				console.log("...eventAdjusted['CV-02']:",eventAdjusted['CV-02']);
			
				expect(eventAdjusted['CV-02']).toEqual(1);
			
				//TEAR DOWN
				CharlesSumner.set('inhand',false);
			});
		});
		
		describe("Check that character played with other 'affinity' characters gets event balance bonus",function(){
			
			xit("should set CharlesSumner & SalmonPChase 'inhand'",function(){
				console.log("!!!!!it should set CharlesSumner & SalmonPChase 'inhand'");
				var inhandBefore = HG.User.get('cards').character.where({inhand:true}),
						inhandAfter;
				console.log("...inhandBefore:",inhandBefore);
				SalmonPChase = Characters.findWhere({'id':'CP-04'}).clone();
				SalmonPChase.set('inhand',true);
				HG.User.get('cards').character.push(SalmonPChase);
				CharlesSumner.set('inhand',true);
				//HarrietBeecherStowe.set('inhand',true);
				inhandAfter = HG.User.get('cards').character.where({inhand:true});
				console.log("...inhandAfter:",inhandAfter);
				expect(inhandAfter).toBeGreaterThan(inhandBefore);
			});
			
			xit("should set CV-13 event in play",function(){
				console.log("!!!!! it should set CV-13 event in play");
				HG.component.Events.debugSetEvent('CV-13');
				expect( Events.current.get('id') ).toEqual('CV-13');
			});
			
			xit("should impact CV-13 event roll", function(){
				console.log("!!!!! it should impact CV-13 event roll");
				HG.component.GameView.rollForEvent(null,{roll:10});
			
				var eventAdjusted = CharlesSumner.get('event_roll_adjusted');
				console.log("...eventAdjusted['CV-13']:",eventAdjusted['CV-13']);
			
				expect(eventAdjusted['CV-13']).toBeGreaterThan(0);//but if other characters are in the mix w/military bonus - this could be higher
			
				//TEAR DOWN
				//CharlesSumner.set('inhand',false);
				//SalmonPChase.set('inhand',false);
			});
		});
	});

	describe("Resource Rolls - character modifier use cases.", function() {
	
		describe("Give resource roll bonus for appropriate character with modifier when event in play", function() {
			//Note: this test has timing issues that I've not been able figure out so far - but source behavior seems to work as of 4/10/14		
			var uncommonCardsBefore,
					uncommonCardsAfter;
		  xit("should roll a union resource (8)", function() {
				console.log("!!!!!!! should roll a union resource (8)");
				uncommonCardsBefore = HG.User.get('cards').resource.filter(function(item){
																		return (item.rarity === 'uncommon');
																	});
				//console.log("uncommonCardsBefore:",uncommonCardsBefore);
				//when a player rolls for a resource while an event is in play AND they have a character with a qualifying roll condition.
				//Roll a 'union' resource
				GameView.rollForResources(null,{roll:8});
				//HG.User.set('roll',8);
				expect( HG.User.get('roll') ).toEqual( 8 );
		  });
	
			xit("should have an extra 'uncommon' resource", function(){
				uncommonCardsAfter = HG.User.get('cards').resource.filter(function(item){
															return (item.rarity === 'uncommon');
														 });
				//console.log("uncommonCardsAfter:",uncommonCardsAfter)
		    expect( uncommonCardsAfter.length ).toBeGreaterThan( uncommonCardsBefore.length );
			});
		});
	
		describe("Roll for a resource while a military event is in play and block a roll bonus", function() {
			beforeEach(function(done) {
			    setTimeout(function() {
			      value = 0;
			      done();
			    }, 1000);
			});
		
			xit("should set CV-13 event in play",function(){
				HG.component.Events.debugSetEvent('CV-13');
				expect( Events.current.get('id') ).toEqual('CV-13');
			});
		
			xit("should add Ulysses Grant to Player deck AND Nathan Bedford Forrest to House deck",function(){
				console.log("!!!!!!!!!! should add Ulysses Grant to Player deck AND Nathan Bedford Forrest to House deck");
				var inhandBefore = HG.User.get('cards').character.where({inhand:true}),
						inhandAfter;
				//Stack team with characters who have just the right modifiers
				UlyssesSGrant = HG.component.Characters.findWhere({'id':'UM-06'}).clone();
				UlyssesSGrant.set('inhand',true);
				HG.User.get('cards').character.push(UlyssesSGrant);
			
				NathanBedfordForrest = HG.component.Characters.findWhere({'id':'UM-02'}).clone();
				NathanBedfordForrest.set('inhand',true);
				HG.House.get('cards').character.push(NathanBedfordForrest);

				inhandAfter = HG.User.get('cards').character.where({inhand:true})
				expect(inhandAfter).toBeGreaterThan(inhandBefore);
			});
		
			xit("should add 80 military points to Grant to unlock his modifier",function(){
				console.log("!!!!!!! should add 80 military points to Grant to unlock his modifier");
				Characters.putAbility(UlyssesSGrant, {amount:80, ability:'military', characterId:'UM-06'});
				expect( UlyssesSGrant.get('ability_change').military ).toEqual(80);
			});
		
			xit("should roll a union resource (8)", function() {
				console.log("!!!!!!! should roll a union resource (8)");
				uncommonCardsBefore = HG.User.get('cards').resource.filter(function(item){
																		return (item.rarity === 'uncommon');
																	});
				//console.log("uncommonCardsBefore:",uncommonCardsBefore);
				//when a player rolls for a resource while an event is in play AND they have a character with a qualifying roll condition.
				//Roll a 'union' resource
				GameView.rollForResources(null,{roll:8});
				//HG.User.set('roll',8);
				expect( HG.User.get('roll') ).toEqual( 8 );
		  });
	
			xit("should leave the union resource roll blocked because of the Nathan Bedford Forrest bonus", function() {
				//no way to determine currently that the roll was blocked - nothing set or bubbles up as a return value.
				var rollWasBlocked = HG.component.GameView.model.get('currentRollBlocked')
				expect( rollWasBlocked ).toEqual( true );
			});
		
		});
	});

	describe("Balance Board impacted by event wins", function(){
		xit("should reset balance boards to neutral states",function(){
			HG.component.BalanceBoards.setCurrentStageIdx(HG.BritishDiplomacy,5);
			HG.component.BalanceBoards.setCurrentStageIdx(HG.ConfederateMorale,6);
			HG.component.BalanceBoards.setCurrentStageIdx(HG.UnionMorale,6);
			HG.component.BalanceBoards.setCurrentStageIdx(HG.UnionEconomy,5);
			HG.component.BalanceBoards.setCurrentStageIdx(HG.ConfederateEconomy,5);
			//spot check
			expect(HG.BritishDiplomacy.get('stageIdx')).toEqual(5);
			expect(HG.ConfederateEconomy.get('stageIdx')).toEqual(5);
		});
		
		xit("should change BritishDiplomacy balance to 'caution' on Union 'game:event-success' event for CV-08",function(){
			var stageIdxBefore = HG.BritishDiplomacy.get('stageIdx'),
					stageIdxAfter;
			HG.vent.trigger('game:event-success',{evt:HG.component.Events.findWhere({'id':'CV-08'}), winner:HG.User, looser:HG.House});
			stageIdxAfter = HG.BritishDiplomacy.get('stageIdx');
			stageName			= HG.BritishDiplomacy.get('currentStage');
			
			expect(stageIdxBefore).toBeGreaterThan(stageIdxAfter);
			expect(stageName).toEqual('caution');
			
		});
		
		xit("should further change BritishDiplomacy balance to 'warning' on Union 'game:event-success' event for CV-09",function(){
			var stageIdxBefore = HG.BritishDiplomacy.get('stageIdx'),
					stageIdxAfter;
			HG.vent.trigger('game:event-success',{evt:HG.component.Events.findWhere({'id':'CV-09'}), winner:HG.User, looser:HG.House});
			stageIdxAfter = HG.BritishDiplomacy.get('stageIdx');
			stageName			= HG.BritishDiplomacy.get('currentStage');
			
			expect(stageIdxBefore).toBeGreaterThan(stageIdxAfter);
			expect(stageName).toEqual('warning');
			
		});
		
		xit("should change the ConfederateEconomy balance to 'warning:low' as a balance to balance knock on effect",function(){
			var confedEconStageName			= HG.ConfederateEconomy.get('currentStage');
			expect(confedEconStageName).toEqual('warning');
		});
		
		xit("should change the ConfederateMorale balance to 'neutral' as a balance to balance knock on effect",function(){
			var confedMoraleStageName			= HG.ConfederateMorale.get('currentStage');
			expect(confedMoraleStageName).toEqual('neutral');
		})
	});
	
	describe("Balance Board impacted by resource upgrades", function(){
		
		xit("should reset balance boards to neutral states",function(){
			//console.log("---- Balance Board impacted by resource upgrades ----");
			HG.component.BalanceBoards.setCurrentStageIdx(HG.BritishDiplomacy,5);
			HG.component.BalanceBoards.setCurrentStageIdx(HG.ConfederateMorale,6);
			HG.component.BalanceBoards.setCurrentStageIdx(HG.UnionMorale,6);
			HG.component.BalanceBoards.setCurrentStageIdx(HG.UnionEconomy,5);
			HG.component.BalanceBoards.setCurrentStageIdx(HG.ConfederateEconomy,5);
			//spot check
			expect(HG.UnionEconomy.get('stageIdx')).toEqual(5);
			expect(HG.ConfederateEconomy.get('stageIdx')).toEqual(5);
		});
		
		xit("should add resources needed to trade for a Factory - UR-11",function(){
			Players.addCard('resource',FactoryWorker,'hans');
			Players.addCard('resource',SmallManufacturer,'hans');
			Players.addCard('resource',Building,'hans');
			Players.addCard('resource',GoldBar,'hans');
		});
		
		xit("should upgrade for a factory card",function(){
			HG.component.TradeablesView.upgrade('UR-11');
			var hasFactories = HG.User.get('cards').resource.filter(function(item){
														var match = (item.id === 'UR-11')
						  							return ( match);
													}).length;
			expect(hasFactories).toBeGreaterThan(0);
		});
		
		xit("should change to UnionEconomy Balance Board to 'optimistic'",function(){
			var stageName = HG.UnionEconomy.get('currentStage');
			expect(stageName).toEqual('optimistic');
		});
		
	});
	
	describe("Balance Board impacted by passing ability point thresholds", function(){
		xit("should reset balance boards to neutral states",function(){
			HG.component.BalanceBoards.setCurrentStageIdx(HG.BritishDiplomacy,5);
			HG.component.BalanceBoards.setCurrentStageIdx(HG.ConfederateMorale,6);
			HG.component.BalanceBoards.setCurrentStageIdx(HG.UnionMorale,6);
			HG.component.BalanceBoards.setCurrentStageIdx(HG.UnionEconomy,5);
			HG.component.BalanceBoards.setCurrentStageIdx(HG.ConfederateEconomy,5);
			//spot check
			expect(HG.UnionEconomy.get('stageIdx')).toEqual(5);
			expect(HG.ConfederateEconomy.get('stageIdx')).toEqual(5);
		});
		
		xit("should add enough resources to pass first, second, and third industrial threshold",function(){
			for(var i=0; i<16;i++){
				Players.addCard('resource',SmallManufacturer,'hans');
			}
		});
		
		
		xit("should change to UnionEconomy Balance Board to 'optimistic'",function(){
			var stageName = HG.UnionEconomy.get('currentStage');
			expect(stageName).toEqual('optimistic');
		});
		
	});
	
	describe("Trigger an History Event listener", function(){
		
		//force the balance board all the way to 'terminal' in order to generate the needed event.
		xit("should set the British Diplomacy balance board to terminal:union",function(){
			HG.component.BalanceBoards.incrementCurrentStageIdx(HG.BritishDiplomacy,7);
			
			var stageName = HG.BritishDiplomacy.get('currentStage');
			expect(stageName).toEqual('terminal');
		});
		
		//the History Event with a listener should then set itself into play.
		xit("should have triggered the 'Battle of Portland,Maine' into play",function(){
			expect(Events.current.get('id')).toEqual('UV-01');
		});
	});
	
	describe("LocalStorage use cases.", function() {
		
		describe("Saving the state of which event is in play.", function() {
			xit("should reset the User's History Event related properties",function(){
				//Backbone.LocalStorage._setData('model/players.json')[1].eventProgressIdx;
				HG.User.save({'eventProgressIdx': 0}, {patch: true});
				HG.User.save({'eventInPlay': null}, {patch: true});
				HG.User.save({'gameBalance': 7}, {patch: true});
				
				expect(HG.User.get('gameBalance')).toEqual(7);
			});
			
			xit("should set the first event in play",function(){
				Events.setNextInPlay();
			});
			
			xit("should save the current event and the progress of play index locally",function(){
				var evtProgressIdx 	= Backbone.LocalStorage._getData('model/players.json')[1].eventProgressIdx,
						evtInPlay				=	Backbone.LocalStorage._getData('model/players.json')[1].eventInPlay;
				
				expect(evtProgressIdx).toEqual(0);
				expect(evtInPlay).toEqual('CV-01');
			});
			
		});
		
		describe("Saving the game balance state after event is won by User.", function() {
			it("should reset the User's History Event related properties",function(){
				console.log("----- it should reset the User's History Event related properties -----");
				HG.User.save({'eventProgressIdx': 0}, {patch: true});
				HG.User.save({'eventInPlay': null}, {patch: true});
				HG.User.save({'gameBalance': 7}, {patch: true});
				
				expect(HG.User.get('gameBalance')).toEqual(7);
			});
			
			it("should set the first event in play",function(){
				Events.setNextInPlay();
				var evtInPlay	=	Backbone.LocalStorage._getData('model/players.json')[1].eventInPlay;
				//expect(evtInPlay).toEqual('CV-01');
			});
			
			it("should add required social resources to play the event",function(){
				for(var i=0;i<5;i++){
					Players.addCard('resource',Bookpublisher,'hans');
				}
				for(var i=0;i<2;i++){
					Players.addCard('resource',Congressman,'hans');
				}
				Players.addCard('resource',Abolitionist,'hans');
			});
			
			it("should roll for an event, win, and reset the game balance.)", function(){
				console.log("----- it should roll for an event, win, and reset the game balance. -----");
				var gameBalance,
						evtInPlay;
				HG.component.GameView.rollForEvent(null,{roll:12});
				gameBalance = Backbone.LocalStorage._getData('model/players.json')[1].gameBalance,
				evtInPlay		=	Backbone.LocalStorage._getData('model/players.json')[1].eventInPlay;
				
				//expect(evtInPlay).toEqual(null);
				expect(gameBalance).toEqual(6);
			});
			
			it("should set the next event ('CV-02') in play", function(){
				console.log("----- it should set the next event ('CV-02') in play -----");
				Events.setNextInPlay();
				var evtInPlay		=	Backbone.LocalStorage._getData('model/players.json')[1].eventInPlay;
				expect(evtInPlay).toEqual('CV-02');
			});
			
			it("should roll for 'CV-02', win, and reset the game balance again.)", function(){
				console.log("----- it should roll for 'CV-02', win, and reset the game balance again -----");
				var gameBalance,
						evtInPlay;
				HG.component.GameView.rollForEvent(null,{roll:11});
				gameBalance = Backbone.LocalStorage._getData('model/players.json')[1].gameBalance,
				evtInPlay		=	Backbone.LocalStorage._getData('model/players.json')[1].eventInPlay;
				
				//expect(evtInPlay).toEqual(null);
				expect(gameBalance).toEqual(5);
			});
		});
		
	});
});