/* ---
	This file holds declarations specific to your game instance.
--- */

//These are currently only convenient shorthands for the specRunner

HG.vent.on("component:data-loaded", function(args){
	//console.log("GameEra caught component:data-loaded ",args.component);
	if(args.component === 'Balance'){
		HG.BritishDiplomacy		= HG.component.BalanceBoards.findWhere({type:'diplomacy',variety:'british'});
		HG.ConfederateMorale	= HG.component.BalanceBoards.findWhere({type:'morale',variety:'confederate'});
		HG.ConfederateEconomy	= HG.component.BalanceBoards.findWhere({type:'economic',variety:'confederate'});
		HG.UnionMorale				= HG.component.BalanceBoards.findWhere({type:'morale',variety:'union'});
		HG.UnionEconomy				= HG.component.BalanceBoards.findWhere({type:'economic',variety:'union'});
	}
});
