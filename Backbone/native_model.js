/* Hardwired data for the History Game */

var GameData = {
  users: {
    house:{cards:{character:[],resource:[],influence:[],wild:[]}, stats:{}, tradingwell:[], canTrade:false, canPlayEvent:false},
    hans:{cards:{character:[],resource:[],influence:[],wild:[]}, stats:{}, tradingwell:[], canTrade:false, canPlayEvent:false},
    ahlden:{cards:{character:[],resource:[],influence:[],wild:[]}, stats:{}, tradingwell:[], canTrade:false, canPlayEvent:false},
    heath:{cards:{character:[],resource:[],influence:[],wild:[]}, stats:{}, tradingwell:[], canTrade:false, canPlayEvent:false},
    quinn:{cards:{character:[],resource:[],influence:[],wild:[]}, stats:{}, tradingwell:[], canTrade:false, canPlayEvent:false},
    elle:{cards:{ character:[], resource:[], influence:[], wild:[] }, stats:{}, tradingwell:[], canTrade:false, canPlayEvent:false},
    kerri:{cards:{character:[],resource:[],influence:[],wild:[]}, stats:{}, tradingwell:[], canTrade:false, canPlayEvent:false}
  },
  eventOrder:[
    'CV-01','CV-04','CV-08','CV-09','CV-10'
  ],
  events: {
    'CV-01':{
      id: 'CV-01',
      name: "Publishing of Uncle Tom's Cabin",
      description: 'Written by Harriet Beecher Stowe 1852',
      event_ability_total: 15,
      ability:{
        social: 10,
	political: 0
      },
      aftermath: 'Union win - all sides draw two political characters, else draw one political character.',
      type: 'event'
    },
    'CV-02':{
      id: 'CV-02',
      name: "Kansas-Nebraska Act of 1854",
      description: 'Created new territories and game them the right to determine for themselves if they would allow salvery.',
      event_ability_total: 25,
      ability:{
        social: 10,
	political: 10
      },
      aftermath: '',
      type: 'event'
    },
    'CV-03':{
      id: 'CV-03',
      name: "'Bleeding Kansas' 1854-1861",
      description: 'A series of violent political confrontations between pro-slavery and anti-slavery elements to determine if the territory of Kansas enter the Union as a "free" state',
      event_ability_total: 25,
      ability:{
        social: 5,
	political: 5,
        military: 10,
      },
      aftermath: '',
      type: 'event'
    },
    'CV-04':{
      id: 'CV-04',
      name: 'Raid on Harper\'s Ferry',
      description: 'October 16th, 1859',
      event_ability_total: 0,
      aftermath: 'Confederates draw one military character card and three resource cards.',
      type: 'catalyst'
    },
    'CV-05':{
      id: 'CV-05',
      name: "Presidential Election of 1860",
      description: 'The United States had been divided during the 1850s on questions surrounding the expansion of slavery and the rights of slave owners.',
      event_ability_total: 35,
      ability:{
        social: 0,
	political: 20,
      },
      aftermath:{
        union:'Promotes Lincoln to President and triggers seven southern states to secede from the Union and eventually form the Confederacy.',
	confederate:'Promotes Breckinridge to President.'
      },
      type: 'event'
    },
    'CV-06':{
      id: 'CV-06',
      name: 'Battle of Fort Sumter',
      description: 'April 12th - 14th, 1861',
      event_ability_total: 40,
      ability:{
        military: 30,
	political: 0,
	espionage: 0
      },
      aftermath: '',
      requires: 'atleast one artillery resource or naval officer or one naval resource',
      type: 'event'
    },
    'CV-07':{
      id: 'CV-07',
      name: 'Lincoln Calls for Volunteers',
      description: 'April 15th, 1861 - The newly elected President Lincoln issues a public call for 75,000 volunteers to join the Union Army and suppress the rebellion.',
      event_ability_total: 0,
      aftermath: 'Virginia, North Carolina, Tennessee, Arkansas sucede from Union. All players draw two resource cards.',
      type: 'catalyst'
    },
    'CV-08':{
      id: 'CV-08',
      name: 'Battle of New Orleans',
      description: 'April 18th - 28th, 1862',
      event_ability_total: 120,
      ability:{
        military: 120
      },
      aftermath: 'Union victory means loss of any support from Europe.',
      requires: 'atleast one naval officer and one naval resource',
      type: 'event'
    },
    'CV-09':{
      id: 'CV-09',
      name: 'New York City Draft Riots',
      description: 'July 13th - 16th, 1863',
      event_ability_total: 50,
      ability:{
        military: 10,
	political: 20,
	social: 5
      },
      aftermath: 'A Confederate victory slows the Union Draft effort. The next 5 military resources drawn must be put back.',
      type: 'event'
    },
    'CV-10':{
      id: 'CV-10',
      name: 'Battle of Vicksburg',
      description: 'May 18th - July 4th, 1863',
      event_ability_total: 120,
      ability:{
        military: 90,
	political: 0,
	social: 0
      },
      aftermath: '',
      type: 'event'
    }
  },
  resources: [
    {
      id: 'UR-01',
      name: '9th Virginia Cavalry',
      affiliation: 'confederate',
      ability_military: 10,
      type: 'resource',
      rarity: 'uncommon'
    },
    {
      id: 'UR-02',
      name: 'Jr. Army Officer',
      ability:{
        military: 5
      },
      type: 'resource',
      rarity: 'uncommon'
    },
    {
      id: 'UR-03',
      name: 'Staff Army Officer',
      ability:{
        military: 10
      },
      type: 'resource',
      rarity: 'uncommon'
    },
    {
      id: 'RR-01',
      name: 'General Army Officer',
      ability:{
        military: 15
      },
      type: 'resource',
      rarity: 'rare'
    },
    {
      id: 'UR-04',
      name: 'Jr. Naval Officer',
      ability:{
        military: 5
      },
      type: 'resource',
      rarity: 'uncommon'
    },
    {
      id: 'UR-05',
      name: 'Naval Officer',
      ability:{
        military: 10
      },
      type: 'resource',
      rarity: 'uncommon'
    },
    {
      id: 'UR-06',
      name: 'Artillery Unit',
      ability:{
        military: 20
      },
      type: 'resource',
      rarity: 'uncommon'
    },
    {
      id: 'UR-07',
      name: 'Infantry Squad',
      ability:{
        military: 10
      },
      type: 'resource',
      rarity: 'uncommon'
    },
    {
      id: 'UR-08',
      name: 'Infantry Unit',
      ability:{
        military: 20
      },
      type: 'resource',
      rarity: 'uncommon'
    },
    {
      id: 'UR-09',
      name: 'Senator',
      ability:{
        political: 10
      },
      type: 'resource',
      rarity: 'uncommon'
    },
    {
      id: 'UR-10',
      name: 'Trade Agreement',
      ability:{
        political: 20
      },
      type: 'resource',
      rarity: 'uncommon'
    },
    {
      id: 'UR-11',
      name: 'Factory',
      ability:{
        industrial: 5
      },
      type: 'resource',
      rarity: 'uncommon'
    },
    {
      id: 'CR-01',
      name: 'Artillery Piece',
      ability:{
        military: 5
      },
      type: 'resource',
      rarity: 'common'
    },
    {
      id: 'CR-02',
      name: 'Enlisted Foot Soldier',
      ability:{
        military: 1
      },
      type: 'resource',
      rarity: 'common'
    },
    {
      id: 'CR-03',
      name: 'Food Rations',
      type: 'resource',
      rarity: 'common'
    },
    {
      id: 'CR-04',
      name: 'Ammunition',
      ability:{
        military: 1
      },
      type: 'resource',
      rarity: 'common'
    },
    {
      id: 'CR-05',
      name: 'Foot Soldier (N.C.O.)',
      ability:{
        military: 3
      },
      type: 'resource',
      rarity: 'common'
    },
    {
      id: 'CR-06',
      name: 'U.S. Congressman',
      ability:{
        political: 5
      },
      type: 'resource',
      rarity: 'common'
    },
    {
      id: 'CR-07',
      name: 'assemblyman',
      ability:{
        political: 2
      },
      type: 'resource',
      rarity: 'common'
    },
    {
      id: 'CR-08',
      name: 'Foreign Official',
      ability:{
        political: 2
      },
      type: 'resource',
      rarity: 'common'
    },
    {
      id: 'CR-09',
      name: 'abolitionist',
      ability:{
        social: 1
      },
      type: 'resource',
      rarity: 'common'
    },
    {
      id: 'CR-10',
      name: 'clergyman',
      ability:{
        social: 2
      },
      type: 'resource',
      rarity: 'common'
    },
    {
      id: 'CR-11',
      name: 'Newspaper Editor',
      ability:{
        social: 3
      },
      type: 'resource',
      rarity: 'common'
    },
    {
      id: 'CR-12',
      name: 'Book Publisher',
      ability:{
        social: 3
      },
      type: 'resource',
      rarity: 'common'
    },
    {
      id: 'CR-13',
      name: 'Factory Worker',
      ability:{
        industrial: 1
      },
      type: 'resource',
      rarity: 'common'
    },
    {
      id: 'CR-14',
      name: 'informant',
      ability:{
        espionage: 1
      },
      type: 'resource',
      rarity: 'common'
    },
    {
      id: 'CR-15',
      name: 'Spy',
      ability:{
        espionage: 3
      },
      type: 'resource',
      rarity: 'common'
    },
    {
      id: 'CR-16',
      name: 'Agent Provocateur',
      ability:{
        espionage: 2
      },
      type: 'resource',
      rarity: 'common'
    },
    {
      id: 'CR-17',
      name: 'Small Manufacturer',
      ability:{
        industrial: 3
      },
      type: 'resource',
      rarity: 'common'
    },
    
  ],
  resourceDefaults:{
    union:['UR-02','CR-01','CR-02','CR-03','CR-04'],
    union_military:['UR-07','CR-03','CR-04','UR-02'],
    union_political:['CR-02','CR-03','CR-02','CR-06','CR-08'],
    union_social:['CR-02','CR-03','CR-04','CR-11','CR-09','CR-10'],
    union_industrial:['CR-13','CR-02','CR-03','CR-04','CR-03'],
    union_espionage:['CR-14','CR-02','CR-03','CR-04','CR-15','CR-16'],
    confederate:['UR-02','CR-01','CR-02','CR-04'],
    confederate_military:['UR-02','CR-01','CR-02','CR-03','CR-04'],
    confederate_political:['CR-02','CR-03','CR-02','CR-06','CR-07'],
    confederate_social:['CR-02','CR-03','CR-04','CR-10','CR-11','CR-12'],
    confederate_industrial:['CR-17','CR-02','CR-03','CR-04','CR-03'],
    confederate_espionage:['CR-14','CR-02','CR-03','CR-04','CR-15','CR-16']
  },
  resourceTradeMap : {
    'UR-07':{'CR-02':2,'CR-05':1},
    'UR-08':{'UR-07':1,'CR-03':1,'CR-04':1,'UR-02':1},
    'UR-06':{'UR-02':1,'CR-01':1,'CR-02':1,'CR-03':1,'CR-04':1}
  },  
  influence: [
    {
      id: 'CF-01',
      name: 'Political Ability Bonus',
      description: 'A character of your choice gains 5 political ability points',
      ability:{political: 5},
      rarity: 'common',
      type: 'influence'
    },
    {
      id: 'CF-02',
      name: 'Military Ability Bonus',
      description: 'A character of your choice gains 5 military ability points',
      ability:{military: 5},
      rarity: 'common',
      type: 'influence'
    },
    {
      id: 'CF-03',
      name: 'Social Ability Bonus',
      description: 'A character of your choice gains 5 social ability points',
      ability:{social: 5},
      rarity: 'common',
      type: 'influence'
    },
    {
      id: 'CF-04',
      name: 'Espionage Ability Bonus',
      description: 'A character of your choice gains 5 espionage ability points',
      ability:{espionage: 5},
      rarity: 'common',
      type: 'influence'
    },
    {
      id: 'CF-05',
      name: 'Industrial Ability Bonus',
      description: 'A character of your choice gains 5 industrial ability points',
      ability:{industrial: 5},
      rarity: 'common',
      type: 'influence'
    }
  ],
  wild: [
    {
      id: 'CW-01',
      name: 'Capture Spies',
      description: 'All opposing players must discard character cards with espionage abilities',
      rarity: 'common',
      type: 'wild'
    },
    {
      id: 'UW-01',
      name: 'Change Sides',
      description: 'Change some characters natural affiliation with a side and force them to be on the other side.',
      rarity: 'uncommon',
      type: 'wild'
    },
    {
      id: 'CW-02',
      name: 'Assassination',
      description: 'Remove one character card from an opposing player.',
      rarity: 'common',
      type: 'wild'
    },
    {
      id: 'CW-03',
      name: 'Trade Character',
      description: 'Trade a character of your choice for the next character in your stack.',
      rarity: 'common',
      type: 'wild'
    },
    {
      id: 'CW-05',
      name: 'Pick Character',
      description: 'Pick any character from your stack.',
      rarity: 'common',
      type: 'wild'
    },
    {
      id: 'CW-06',
      name: 'Ability Transformation',
      description: 'Transform one of your character\'s abilities into any other ability and maintain point value.',
      rarity: 'common',
      type: 'wild'
    },
    {
      id: 'UW-02',
      name: 'Shift Balance',
      description: 'Shift Event Balance by two spaces in your favor.',
      rarity: 'uncommon',
      type: 'wild'
    },
    {
      id: 'UW-03',
      name: 'Force Event',
      description: 'You may force the play of an event of your choice. Any current events are terminated.',
      rarity: 'uncommon',
      type: 'wild'
    },
    {
      id: 'UW-04',
      name: 'Shotgun Marriage',
      description: 'todo: figure out what this card does. maybe combines some abilities and changes last name of woman.',
      rarity: 'uncommon',
      type: 'wild'
    },
    {
      id: 'UW-05',
      name: 'Roll-Up Plus',
      description: 'Transfer all of a characters ability scores to an ability of your choice and add 10 more points.',
      rarity: 'uncommon',
      type: 'wild'
    }
  ],
  mythic_character: {
    id: 'MM-01',
    name: 'Paul Bunyan',
    headline: 'A Giant Lumberjack of Unusual Skill',
    inhand: false,
    affiliation: 'none',
    ability:{
      military: 20
    },
    modifier:{
      condition: 'Played during a military event taking place in the woods',
      bonus: '+4 on military event rolls'
    },
    rarity:'mythic',
    type: 'character'
  },
  characters: [
  {
    id: 'CP-01',
    name: 'Alexander H. Stephens',
    headline: 'Vice President of the Confederate States',
    affiliation: 'confederate',
    ability:{
      political: 20
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'CP-02',
    name: 'Charles Sumner',
    headline: 'Senator from Massachusetts',
    affiliation: 'union',
    ability:{
      political: 20
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'CP-03',
    name: 'Robert M.T. Hunter',
    headline: 'Confederate Secretary of State',
    affiliation: 'confederate',
    ability:{
      political: 15
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'CP-04',
    name: 'Salmon P. Chase',
    headline: 'Senator from Ohio',
    affiliation: 'union',
    ability:{
      political: 15
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'CP-05',
    name: 'LeRoy Pope Walker',
    headline: 'Confederate Secretary of War',
    affiliation: 'confederate',
    ability:{
      political: 5,
      military: 10
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'CP-06',
    name: 'Stephen A. Douglas',
    headline: 'Senator from Illinois',
    affiliation: 'union',
    ability: {
      political: 20
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'CS-01',
    name: 'Mary Boykin Chesnut',
    headline: 'Famous Diarist and wife of an Confederate senator',
    affiliation: 'confederate',
    ability:{
      political: 5,
      social: 10,
    },
    modifier:{
      condition: '+10 social ability points',
      bonus: '+1 on social event rolls'
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'CS-02',
    name: 'Mary Todd Lincoln',
    headline: 'First Lady - wife of President Lincoln',
    affiliation: 'union',
    ability:{
      political: 5,
      social: 5
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'CS-03',
    name: 'Mary Custis Lee',
    headline: 'Wife of Robert E. Lee',
    affiliation: 'confederate',
    ability:{
      political: 5,
      social: 5
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'CS-04',
    name: 'Sarah Dawson Morgan',
    headline: 'Diarist',
    affiliation: 'confederate',
    ability:{
      social: 2
    },
    modifier:{
      condition: '+5 social ability points',
      bonus: '+1 on social event rolls'
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'CS-05',
    name: 'Elizabeth Keckley',
    headline: 'Aid to First Lady and Former Slave',
    affiliation: 'union',
    ability:{
      social: 2
    },
    affinity:{
      condition: 'when played with Mary Todd Lincoln',
      bonus: '+3 social ability points'
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'CS-06',
    name: 'Varina Davis',
    headline: 'First Lady and wife of Jefferson Davis',
    affiliation: 'confederate',
    ability:{
      social: 5
    },
    modifier:{
      condition: '+5 social ability points',
      bonus: '+1 on social event rolls'
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'RS-01',
    name: 'Harriet Beecher Stowe',
    headline: 'American Abolitionist and Author',
    affiliation: 'union',
    ability:{
      social: 20
    },
    modifier:{
      condition: '+10 social ability points',
      bonus: '+2 on social event rolls'
    },
    affinity:{
      condition: 'When played during Uncle Toms Cabin Event',
      bonus: 'wins Uncle Toms Cabin Event'
    },
    rarity:'rare',
    type: 'character'
  },
  {
    id: 'UP-01',
    name: 'John Sherman',
    headline: 'Senator from Ohio',
    affiliation: 'union',
    ability:{
      political: 10,
      industrial: 10
    },
    affinity:{
      condition: 'When played with brother - General Sherman',
      bonus: '+2 on political event rolls'
    },
    rarity:'uncommon',
    type: 'character'
  },
  {
    id: 'UP-02',
    name: 'Abraham Lincoln',
    headline: 'Congressmen from Illinois',
    affiliation: 'union',
    ability:{
      political: 20,
      social: 5,
      military: 5
    },
    modifier:{
      condition: 'On Union win of Presidential Election of 1860.',
      bonus: 'Automatically promoted to President. Add 10 political and social ability points.'
    },
    rarity:'uncommon',
    type: 'character'
  },
  {
    id: 'UP-03',
    name: 'John C. Breckinridge',
    headline: 'Congressmen from Kentucky',
    affiliation: 'confederate',
    ability:{
      political: 20,
      military: 0
    },
    modifier:{
      condition: 'On Confederate win of Presidential Election of 1860.',
      bonus: 'Automatically promoted to President. Add 10 political and social ability points.',
      condition: 'On Union win of Presidential Election of 1860.',
      bonus: 'Automatically promoted to brigadier general. Add 15 military points and subtract 15 political ability points.'
    },
    rarity:'uncommon',
    type: 'character'
  },
  {
    id: 'CM-01',
    name: 'William Askew',
    headline: 'Private in the 1st Georgia Regiment',
    affiliation: 'confederate',
    ability:{
      military: 2
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'CM-02',
    name: 'John White',
    headline: 'Private in the Virginia Regiment',
    affiliation: 'confederate',
    ability:{
      military: 2
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'CM-03',
    name: 'Robert Patterson',
    headline: 'Private in the 12th Tennessee Infantry',
    affiliation: 'confederate',
    ability:{
      military: 2
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'CM-04',
    name: 'George Henry Graffam',
    headline: 'Private in the 30th Maine Infantry',
    affiliation: 'union',
    ability:{
      military: 2
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'CM-05',
    name: 'E. Joseph Averill',
    headline: 'Sargeant in the 6th Vermont Infantry',
    affiliation: 'union',
    ability:{
      military: 3
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'CM-06',
    name: 'E.J. Buck',
    headline: 'Sargeant in the 18th Wisconsin Volunteer Infantry',
    affiliation: 'union',
    ability:{
      military: 3
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'CE-01',
    name: 'Isabelle Marie Boyd',
    headline: 'Confederate Spy',
    affiliation: 'confederate',
    ability:{
      espionage: 5,
      social: 3
    },
    rarity:'common',
    type: 'character'
  },
  {
    id: 'UM-01',
    name: 'Stonewall Jackson',
    headline: 'Confederate General',
    affiliation: 'confederate',
    ability:{
      military: 35,
      social: 5
    },
    affinity:{
      condition: 'When played with General Robert E. Lee',
      bonus: '+2 on political event rolls'
    },
    rarity:'uncommon',
    remove_from_play: 'After Battle of Chancellorsville',
    type: 'character'
  },
  {
    id: 'UM-02',
    name: 'Nathan Bedford Forrest',
    headline: 'Confederate General',
    affiliation: 'confederate',
    ability:{
      military: 30,
      industrial: 20,
      social: 5
    },
    modifier:{
      condition: 'During a military event',
      bonus: 'The opposing side is prevented from collecting resources.'
    },
    type: 'character'
  },
  {
    id: 'UM-03',
    name: 'Robert Anderson',
    headline: 'Union Major',
    affiliation: 'union',
    ability:{
      military: 15,
      political: 5
    },
    modifier:{
      condition: 'When played during the Fort Sumter Event',
      bonus: '+10 military ability'
    },
    rarity:'uncommon',
    type: 'character'
  },
  {
    id: 'UM-04',
    name: 'William Quantrill',
    headline: 'Confederate Captain and Guerilla Leader',
    affiliation: 'confederate',
    ability:{
      military: 10
    },
    modifier:{
      condition: '+10 military ability',
      bonus: 'During a military event the opposing side is prevented from collecting resources.'
    },
    rarity:'uncommon',
    type: 'character'
  },
  {
    id: 'UM-05',
    name: 'John Brown',
    headline: 'American Revolutionary Abolitionist',
    affiliation: 'union',
    ability:{
      political: 5,
      social: 10,
      military: 15
    },
    modifier:{
      condition: 'When played during the "Bleeding Kansas" event',
      bonus: 'Improve Union event balance roll by 2 points.'
    },
    rarity:'uncommon',
    remove_from_play: 'After Harper\'s Ferry event.',
    type: 'character'
  },
  {
    id: 'UI-01',
    name: 'Andrew Carnegie',
    headline: 'Wealthy Industrialist',
    affiliation: 'union',
    ability:{
      military: 5,
      industrial: 25,
      social: 10
    },
    rarity:'uncommon',
    type: 'character'
  },
  {
    id: 'UI-02',
    name: 'Charles Rigdon',
    headline: 'Confederate Pistol Manufacturer',
    affiliation: 'confederate',
    ability:{
      industrial: 15
    },
    rarity:'uncommon',
    type: 'character'
  },
  {
    id: 'UE-01',
    name: 'Rose Greenhow',
    headline: 'Confederate Spy',
    affiliation: 'confederate',
    ability:{
      espionage: 15,
      social: 5
    },
    modifier:{
      condition: '+5 espionage ability points',
      bonus: 'reduce opposing sides event roll by -1'
    },
    rarity:'uncommon',
    type: 'character'
  }
  ],
  resource_guides: {
    union:[null,null,null,null,null,null,'resource','resource','resource','influence','influence','character'],
    confederate:[null,'wild','resource','resource','character','influence','resource',null,null,null,null,null]
  },
  count: function(user, query){
    var count = 0,
    props=[],
    vals=[],
    cards,
    len;
    if(user && query){
      cards = GameData.users[user].cards[query.model];
      len = cards.length;
      //transfrom select object into matching set of arrays
      //this allows us to use multiple name/value pairs
      for(var i in query.select){
        props.push(i);
        vals.push(query.select[i]);
      };
      //look up matching cards
      //todo: for now this just uses the first name/value pair
      //probably need to change the while loop below to select on multiple pairs
      while(len--){
        if(cards[len][props[0]] === vals[0]){
	  count++;
        }
      }
    }
    return count;
  },
  find: function(user, query, firstMatch){
    var user = user || null,
    firstMatch = firstMatch || false,
    props=[],
    vals=[],
    gdTypeMap = {resource:'resources',resources:'resources',character:'characters',characters:'characters'},
    cards = (user) ? GameData.users[user].cards[query.model] : GameData[gdTypeMap[query.model]];
    //console.log("gdTypeMap[query.model]:",gdTypeMap[query.model])
    //console.log('DS find() cards:',cards);
    var len = cards.length,
    card = [];
    
    //transfrom select object into matching set of arrays
    //this allows us to use multiple name/value pairs
    for(var i in query.select){
      props.push(i);
      vals.push(query.select[i]);
    };
    //look up matching cards
    //todo: for now this just uses the first name/value pair
    //probably need to change the while loop below to select on multiple pairs
    while(len--){
      if(cards[len][props[0]] === vals[0]){
        card.push(cards[len]);
      }
    }
    //return an array of matches, an empty array, or a single match (not in an array)
    return (firstMatch) ? card.pop() : card;
  },
  remove: function(user, query){
    var user = user || null,
    props=[],
    vals=[],
    cards = (user) ? GameData.users[user].cards[query.model] : GameData[query.model],
    success,
    len = cards.length;
    //console.log('DS remove() cards:',cards);
    //transfrom select object into matching set of arrays
    //this allows us to use multiple name/value pairs
    for(var i in query.select){
      props.push(i);
      vals.push(query.select[i]);
    };
    //look up matching cards
    //todo: for now this just uses the first name/value pair
    //probably need to change the while loop below to select on multiple pairs
    while(len--){
      if(cards[len][props[0]] === vals[0]){
	success = cards.splice(len, 1);
	break;
      }
    }
    //return an array of matches, an empty array, or a single match (not in an array)
    return success;
  },
  totalCharacterAbility: function(card){
    var total = 0;
    if(card){
      for(var i in card.ability){
        total+= card.ability[i];
      }
    }
    return total;
  }
};