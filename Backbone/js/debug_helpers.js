//Handy Debug Cheatsheet

//Game
HG.component.GameView.moduleHouse()

//Characters
HG.component.Characters.debugAddCardById('CS-04');
HG.component.Characters.debugAddCardById('CP-04');//Salmon P. Chase (CV-02 modifier)
HG.component.Characters.debugAddCardById('UM-05');//John Brown (CV-03 modifier)
HG.component.Characters.debugAddCardById('RS-01');//Harriet Beecher Stowe (+2 on Social Events)

// ... getting a Player character property 
HG.User.get('cards').character.findWhere({'id':'RS-01'}).get('unlocked');

//Resources
HG.component.Players.addCard('resource',{
  "id": "CR-12",
  "name": "Book Publisher",
  "ability":{
    "social": 3
  },
  "type": "resource",
  "rarity": "common"
},'hans');

HG.component.Players.addCard('resource',{
  "id": "CR-05",
  "name": "Foot Soldier (N.C.O.)",
  "ability":{
    "military": 5
  },
  "type": "resource",
  "rarity": "common"
},'hans');

HG.component.Players.addCard('resource',{
  "id": "CR-06",
  "name": "U.S. Congressman",
  "ability":{
    "political": 5
  },
  "type": "resource",
  "rarity": "common"
},'hans');

//Events
HG.component.Events.debugSetEvent('CV-03');
HG.component.GameView.rollForEvent(null,{roll:12});

/*--- Use Case Scripts---*/

//Play CV-02 w/an exceptional roll (and give opposing player a modifiying character as well)
//pre-conditions: Union, Player Hans
(function(){
	HG.component.Events.debugSetEvent('CV-02');
	
	//Stack team with characters who have just the right modifiers
	HG.component.Characters.debugAddCardById('RS-01',HG.User);
	HG.component.Characters.debugAddCardById('CP-04',HG.User);
	
	//Stack opposing team too...
	HG.component.Characters.debugAddCardById('CS-04',HG.House);//Sarah Dawson Morgan
	
	//Give Mrs. Stowe enough influence to unlock her modifier
	HG.vent.trigger('player:event-roll-modifier-bonus', {amount:5, ability:'social', characterId:'RS-01'});
	
	//Add 1 social resource card to Hans so he can meet CV-02 requirements
	HG.component.Players.addCard('resource',{
	  "id": "CR-12",
	  "name": "Book Publisher",
	  "ability":{
	    "social": 3
	  },
	  "type": "resource",
	  "rarity": "common"
	},'hans');
	
	//Add 2 political resource cards to Hans so he can meet CV-02 requirements
	HG.component.Players.addCard('resource',{
	  "id": "CR-06",
	  "name": "U.S. Congressman",
	  "ability":{
	    "political": 5
	  },
	  "type": "resource",
	  "rarity": "common"
	},'hans');
	
	HG.component.Players.addCard('resource',{
	  "id": "CR-06",
	  "name": "U.S. Congressman",
	  "ability":{
	    "political": 5
	  },
	  "type": "resource",
	  "rarity": "common"
	},'hans');
	
	//Max out the roll
	HG.component.GameView.rollForEvent(null,{roll:12});
})();

//Roll for a resource while CV-02 in play and trigger roll bonus
//pre-conditions: Confederate, Player Hans
(function(){
	HG.component.Events.debugSetEvent('CV-02');
	
	//Stack team with characters who have just the right modifiers
	HG.component.Characters.debugAddCardById('CS-01',HG.User);//Mary Boykin Chesnut
	HG.component.Characters.debugAddCardById('CS-03',HG.User);//Mary Custis Lee
	
	//Give characters enough influence to unlock modifiers
	HG.vent.trigger('player:event-roll-modifier-bonus', {amount:10, ability:'social', characterId:'CS-01'});
	HG.vent.trigger('player:event-roll-modifier-bonus', {amount:10, ability:'social', characterId:'CS-03'});
	
	//Max out the roll
	HG.component.GameView.rollForResources(null,{roll:4});
})();

//Roll for a resource while a military event is in play and block a roll bonus
//pre-conditions: Union, Player Hans
(function(){
	HG.component.Events.debugSetEvent('CV-13');
	
	//Stack team with characters who have just the right modifiers
	HG.component.Characters.debugAddCardById('UM-06',HG.User);//Ulysses S. Grant
	//Stack opposing team with a "blocking" character
	HG.component.Characters.debugAddCardById('UM-02',HG.House);//Nathan Bedford Forrest
	
	//Give characters enough influence to unlock modifiers
	HG.vent.trigger('player:event-roll-modifier-bonus', {amount:80, ability:'military', characterId:'UM-06'});
		
	//Max out the roll
	HG.component.GameView.rollForResources(null,{roll:8});
})();

//Check that multiple modifier conditions work - e.g. "CV-03|CV-09"
//pre-conditions: Union, Player Hans
(function(){
	HG.component.Events.debugSetEvent('CV-01');
	
	//Stack team with characters who have just the right modifiers
	HG.component.Characters.debugAddCardById('CP-02',HG.User);//Charles Sumner
		
	//Max out the roll
	HG.component.GameView.rollForEvent(null,{roll:12});
})();

//Check that character played with required resources gets event balance bonus
//pre-conditions: Union, Player Hans
(function(){
	
	//Stack team with characters who have just the right modifiers
	HG.component.Characters.debugAddCardById('CP-02',HG.User);//Charles Sumner
	
	//Add 3 abolistionist cards to Hans so he can meet the bonus conditions
	HG.component.Players.addCard('resource',{
   "id": "CR-09",
    "name": "abolitionist",
    "ability":{
      "social": 1
    },
    "type": "resource",
    "rarity": "common"
	},'hans');
	
	HG.component.Players.addCard('resource',{
   "id": "CR-09",
    "name": "abolitionist",
    "ability":{
      "social": 1
    },
    "type": "resource",
    "rarity": "common"
	},'hans');
	
	HG.component.Players.addCard('resource',{
   "id": "CR-09",
    "name": "abolitionist",
    "ability":{
      "social": 1
    },
    "type": "resource",
    "rarity": "common"
	},'hans');
	
	HG.component.Players.getResourceMatchingCharacters(HG.User,'resource','balance');
})();

//Play an event and check that a character with a satisfied resource condition impacts the event roll
//pre-conditions: Union, Player Hans
(function(){
	//set event in play
	HG.component.Events.debugSetEvent('CV-03');
	//Stack team with characters who have just the right modifiers
	HG.component.Characters.debugAddCardById('CP-02',HG.User);//Charles Sumner
	HG.component.Characters.debugAddCardById('CP-04',HG.User);//Salmon P. Chase
	
	//Add 3 abolistionist cards to Hans so he can meet the bonus conditions
	HG.component.Players.addCard('resource',{
   "id": "CR-09",
    "name": "abolitionist",
    "ability":{
      "social": 1
    },
    "type": "resource",
    "rarity": "common"
	},'hans');
	
	HG.component.Players.addCard('resource',{
   "id": "CR-09",
    "name": "abolitionist",
    "ability":{
      "social": 1
    },
    "type": "resource",
    "rarity": "common"
	},'hans');
	
	HG.component.Players.addCard('resource',{
   "id": "CR-09",
    "name": "abolitionist",
    "ability":{
      "social": 1
    },
    "type": "resource",
    "rarity": "common"
	},'hans');
	
	HG.component.GameView.rollForEvent(null,{roll:10});
})();

