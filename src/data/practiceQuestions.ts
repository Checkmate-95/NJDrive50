// src/data/practiceQuestions.ts
// Backward-compatible practice data for existing PracticeTestPanel usage.
// Keeps the original field shape used by the UI:
// id, question, answers, correctIndex, explanation
//
// Content is intentionally short, original, and topic-oriented so the app
// can support study/review without embedding a large exam-style question bank.

export interface PracticeQuestion {
  id: string
  question: string
  answers: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  explanation: string
}

export const practiceQuestions: PracticeQuestion[] = [
  {
    id: "q1",
    question: "What is the safest approach when driving through a school area?",
    answers: [
      "Keep normal speed if traffic is light",
      "Slow down, follow posted signs, and watch for children",
      "Pass slower drivers quickly",
      "Use your horn near crossings",
    ],
    correctIndex: 1,
    explanation:
      "In school areas, drivers should slow down, follow posted limits, and stay alert for children, buses, and crossing activity.",
  },
  {
    id: "q2",
    question: "When should headlights be turned on?",
    answers: [
      "Only on highways",
      "Whenever driving feels difficult",
      "At required night hours and when visibility is poor",
      "Only during heavy rain",
    ],
    correctIndex: 2,
    explanation:
      "Headlights are required during certain night-time hours and whenever visibility is reduced.",
  },
  {
    id: "q3",
    question: "What should a driver do at a flashing red signal?",
    answers: [
      "Proceed if no cars are coming",
      "Treat it like a stop and continue when safe",
      "Slow slightly and keep moving",
      "Turn only if traffic is clear",
    ],
    correctIndex: 1,
    explanation:
      "A flashing red signal should be treated like a stop sign: come to a complete stop and proceed only when safe.",
  },
  {
    id: "q4",
    question: "What do yellow warning signs generally tell drivers?",
    answers: [
      "A hazard or road condition change is ahead",
      "Parking is allowed",
      "The road is closed",
      "A speed limit is ending",
    ],
    correctIndex: 0,
    explanation:
      "Yellow warning signs alert drivers to hazards or changing road conditions ahead.",
  },
  {
    id: "q5",
    question: "When must drivers yield to pedestrians?",
    answers: [
      "Only if a crossing guard is present",
      "Only in marked crosswalks",
      "Whenever pedestrians are lawfully crossing",
      "Only during daylight",
    ],
    correctIndex: 2,
    explanation:
      "Drivers must yield to pedestrians who are crossing as required by law, including crosswalk situations.",
  },
  {
    id: "q6",
    question: "What is a safe rule for following distance in normal conditions?",
    answers: [
      "Stay one car length back",
      "Use at least a basic time gap and increase it when needed",
      "Follow closely in city traffic",
      "Match the distance of the driver behind you",
    ],
    correctIndex: 1,
    explanation:
      "A time-gap approach is safer than guessing by car length, and the gap should increase in poor conditions.",
  },
  {
    id: "q7",
    question: "Before changing lanes, what should you do first?",
    answers: [
      "Accelerate immediately",
      "Check mirrors, blind spots, and signal",
      "Look only in the rearview mirror",
      "Honk to warn other drivers",
    ],
    correctIndex: 1,
    explanation:
      "A safe lane change includes checking mirrors, checking blind spots, signaling, and moving only when safe.",
  },
  {
    id: "q8",
    question: "What does a red octagonal sign mean?",
    answers: [
      "Yield",
      "Do not enter",
      "Stop",
      "Road work ahead",
    ],
    correctIndex: 2,
    explanation:
      "A red octagonal sign means Stop.",
  },
  {
    id: "q9",
    question: "What should a driver do when roads are wet or slippery?",
    answers: [
      "Drive at the posted limit no matter what",
      "Use cruise control for stability",
      "Reduce speed and leave more space",
      "Stay close to the vehicle ahead",
    ],
    correctIndex: 2,
    explanation:
      "Wet or slippery roads increase stopping distance, so drivers should slow down and increase following distance.",
  },
  {
    id: "q10",
    question: "What is the safest response to an approaching emergency vehicle using lights and siren?",
    answers: [
      "Continue driving normally",
      "Move right and stop when required",
      "Race ahead to clear the lane",
      "Stop in the middle of the road",
    ],
    correctIndex: 1,
    explanation:
      "Drivers should yield appropriately and move out of the way for emergency vehicles as required by law.",
  },
  {
    id: "q11",
    question: "Why is it important to study GDL rules carefully?",
    answers: [
      "They apply only to commercial drivers",
      "They are optional suggestions",
      "New drivers may have special restrictions and requirements",
      "They matter only after a traffic ticket",
    ],
    correctIndex: 2,
    explanation:
      "Graduated Driver License rules can include limits and requirements that new drivers must follow.",
  },
  {
    id: "q12",
    question: "What is the safest attitude toward alcohol, drugs, or impairing medication and driving?",
    answers: [
      "It is fine if you feel confident",
      "Only illegal substances matter",
      "Impairment and driving do not mix",
      "Coffee cancels impairment",
    ],
    correctIndex: 2,
    explanation:
      "Driving while impaired by alcohol, drugs, or some medications is dangerous and can be unlawful.",
  },
  {
    id: "q13",
    question: "What should you do if another driver is tailgating you?",
    answers: [
      "Brake suddenly to warn them",
      "Block them from passing",
      "Create more space and let them pass if possible",
      "Speed far above the limit",
    ],
    correctIndex: 2,
    explanation:
      "The safest response is to avoid escalation, increase space ahead, and allow the aggressive driver to pass when possible.",
  },
  {
    id: "q14",
    question: "What is the safest lighting choice when driving in fog?",
    answers: [
      "High beams",
      "No lights",
      "Low beams",
      "Hazards only",
    ],
    correctIndex: 2,
    explanation:
      "Low beams are safer in fog because high beams can create more glare.",
  },
  {
    id: "q15",
    question: "What should you do if you become drowsy while driving?",
    answers: [
      "Open the window and keep going",
      "Turn up music and continue",
      "Pull over safely and rest",
      "Drive faster to finish sooner",
    ],
    correctIndex: 2,
    explanation:
      "Drowsy driving is dangerous, and the safest action is to stop in a safe place and rest.",
  },
  {
    id: "q16",
    question: "What does a Yield sign require?",
    answers: [
      "Always a full stop",
      "Ignore cross traffic if you are first",
      "Slow down and give the right of way when needed",
      "Speed up through the intersection",
    ],
    correctIndex: 2,
    explanation:
      "A Yield sign means slow down, stay alert, and give the right of way when necessary.",
  },
  {
    id: "q17",
    question: "Why are blind-spot checks important?",
    answers: [
      "Mirrors do not show every area beside your vehicle",
      "They are only needed on highways",
      "They replace turn signals",
      "They are required only for parking",
    ],
    correctIndex: 0,
    explanation:
      "Mirrors do not cover every angle, so blind-spot checks help prevent lane-change collisions.",
  },
  {
    id: "q18",
    question: "What should drivers do when approaching a stopped school bus with flashing red lights?",
    answers: [
      "Pass carefully if no children are visible",
      "Stop at least 25 feet away unless a divided-road exception applies",
      "Keep moving slowly in every situation",
      "Use the shoulder to go around if traffic is backed up",
    ],
    correctIndex: 1,
    explanation:
      "In New Jersey, drivers generally must stop at least 25 feet from a stopped school bus with flashing red lights, with limited exceptions on certain divided roadways.",
  },
  {
    id: "q19",
    question: "What is the safest response if your vehicle begins to skid?",
    answers: [
      "Brake hard immediately",
      "Steer wildly away from the skid",
      "Ease off the gas and steer smoothly",
      "Accelerate sharply",
    ],
    correctIndex: 2,
    explanation:
      "During a skid, abrupt braking or steering can make things worse; smooth control inputs are safer.",
  },
  {
    id: "q20",
    question: "What is the best main source for studying the NJ knowledge test?",
    answers: [
      "Random online comments",
      "Only a friend's memory of the test",
      "The official NJ Driver Manual",
      "Social media clips only",
    ],
    correctIndex: 2,
    explanation:
      "The official NJ Driver Manual is the best primary study source for current knowledge-test preparation.",
  },
  {
    id: "q21",
    question: "What does a flashing yellow signal mean?",
    answers: [
      "Stop completely before proceeding",
      "The light is about to turn red",
      "Slow down and proceed with caution",
      "Yield to all oncoming traffic",
    ],
    correctIndex: 2,
    explanation:
      "A flashing yellow signal means slow down and proceed carefully — it does not require a full stop.",
  },
  {
    id: "q22",
    question: "In New Jersey, what is the speed limit in a school zone unless otherwise posted?",
    answers: [
      "15 mph",
      "25 mph",
      "35 mph",
      "45 mph",
    ],
    correctIndex: 1,
    explanation:
      "The default speed limit in a New Jersey school zone is 25 mph unless a different limit is posted.",
  },
  {
    id: "q23",
    question: "When are you required to use your turn signal?",
    answers: [
      "Only on highways",
      "Only when other cars are nearby",
      "Before every turn and lane change",
      "Only at night",
    ],
    correctIndex: 2,
    explanation:
      "Turn signals must be used before every turn and lane change to communicate your intentions to other drivers.",
  },
  {
    id: "q24",
    question: "What should you do when a traffic light is not working at an intersection?",
    answers: [
      "The driver on the wider road always goes first",
      "Treat the intersection as a four-way stop",
      "Proceed without stopping if no cars are present",
      "Yield only to vehicles on your right",
    ],
    correctIndex: 1,
    explanation:
      "When a traffic signal is out, drivers should treat the intersection as a four-way stop.",
  },
  {
    id: "q25",
    question: "What is the legal blood alcohol concentration (BAC) limit for drivers 21 and older in New Jersey?",
    answers: [
      "0.05%",
      "0.08%",
      "0.10%",
      "0.12%",
    ],
    correctIndex: 1,
    explanation:
      "In New Jersey, a BAC of 0.08% or higher is considered legally impaired for drivers 21 and older.",
  },
  {
    id: "q26",
    question: "What is the BAC limit for drivers under 21 in New Jersey?",
    answers: [
      "0.08%",
      "0.05%",
      "0.02%",
      "0.00%",
    ],
    correctIndex: 2,
    explanation:
      "New Jersey has a zero-tolerance policy for underage drivers. A BAC of 0.01% or higher can result in penalties — effectively 0.02% is the threshold for DUI charges.",
  },
  {
    id: "q27",
    question: "When driving on a highway and an entrance ramp vehicle is merging, what should you do?",
    answers: [
      "Speed up to get ahead of them",
      "Always stop to let them in",
      "Move over or adjust speed to help them merge safely if possible",
      "Flash your headlights as a warning",
    ],
    correctIndex: 2,
    explanation:
      "When safe to do so, adjusting speed or lane position to allow merging vehicles in helps traffic flow smoothly and reduces collision risk.",
  },
  {
    id: "q28",
    question: "What does a white rectangular sign typically indicate?",
    answers: [
      "A warning about road hazards",
      "Regulatory information such as speed limits or turn restrictions",
      "A guide to a nearby service area",
      "A recreational area boundary",
    ],
    correctIndex: 1,
    explanation:
      "White rectangular signs are regulatory signs that communicate rules drivers must follow, such as speed limits.",
  },
  {
    id: "q29",
    question: "What is the correct action when you hear a siren but cannot see the emergency vehicle?",
    answers: [
      "Keep driving until the vehicle is visible",
      "Slow down, move right, and be prepared to stop",
      "Pull into the nearest driveway immediately",
      "Speed up to clear the intersection",
    ],
    correctIndex: 1,
    explanation:
      "When you hear a siren, slow down and move toward the right side of the road even before you can see the vehicle.",
  },
  {
    id: "q30",
    question: "What is the purpose of rumble strips on the side of a road?",
    answers: [
      "To mark bicycle lanes",
      "To alert drivers who are drifting off the roadway",
      "To indicate a school zone ahead",
      "To slow down traffic at intersections",
    ],
    correctIndex: 1,
    explanation:
      "Rumble strips create vibration and noise to warn drivers that they are drifting off the edge of the road.",
  },
  {
    id: "q31",
    question: "In New Jersey, how far before a turn must you signal?",
    answers: [
      "At least 10 feet",
      "At least 50 feet",
      "At least 100 feet",
      "At least 200 feet",
    ],
    correctIndex: 2,
    explanation:
      "New Jersey law requires drivers to signal at least 100 feet before making a turn.",
  },
  {
    id: "q32",
    question: "What does a green arrow signal mean?",
    answers: [
      "Yield to oncoming traffic before turning",
      "You may move in the direction of the arrow — the path is protected",
      "Pedestrians have the right of way",
      "Proceed only if the intersection is clear",
    ],
    correctIndex: 1,
    explanation:
      "A green arrow is a protected signal meaning traffic in your path has been stopped and you may move in that direction.",
  },
  {
    id: "q33",
    question: "What should you do if you miss your highway exit?",
    answers: [
      "Reverse on the shoulder to reach the exit",
      "Stop and wait for traffic to clear",
      "Continue to the next exit and find an alternate route",
      "Cross the median to turn around",
    ],
    correctIndex: 2,
    explanation:
      "Missing an exit is common. The safe response is to continue forward and use the next exit — reversing or crossing a median is dangerous and illegal.",
  },
  {
    id: "q34",
    question: "What is the correct hand position recommended for steering?",
    answers: [
      "One hand at the top of the wheel",
      "Both hands low on the wheel",
      "Hands at the 9 and 3 o'clock positions",
      "Hands at 12 and 6 o'clock",
    ],
    correctIndex: 2,
    explanation:
      "The 9 and 3 o'clock position provides good vehicle control and is the currently recommended hand placement.",
  },
  {
    id: "q35",
    question: "What does it mean when pavement markings are yellow?",
    answers: [
      "They separate traffic moving in the same direction",
      "They mark the right edge of the road",
      "They separate traffic moving in opposite directions",
      "They indicate a no-passing zone only",
    ],
    correctIndex: 2,
    explanation:
      "Yellow pavement markings separate lanes of traffic traveling in opposite directions.",
  },
  {
    id: "q36",
    question: "When is it legal to pass on the right in New Jersey?",
    answers: [
      "Whenever traffic is moving slowly",
      "Only on roads with two or more lanes moving in the same direction",
      "On any road if the left lane is occupied",
      "Only on one-way streets with no markings",
    ],
    correctIndex: 1,
    explanation:
      "Passing on the right is permitted in New Jersey on roads with multiple lanes traveling in the same direction.",
  },
  {
    id: "q37",
    question: "What should you do if your accelerator sticks while driving?",
    answers: [
      "Turn off the engine immediately at highway speed",
      "Shift to neutral, steer safely, and brake to a stop",
      "Pump the accelerator to free it",
      "Steer into a barrier to slow down",
    ],
    correctIndex: 1,
    explanation:
      "If the accelerator sticks, shift to neutral to cut power, steer to safety, and brake to a controlled stop.",
  },
  {
    id: "q38",
    question: "What does a double solid yellow center line mean?",
    answers: [
      "Passing is allowed for both directions",
      "Passing is allowed only from the left lane",
      "Neither direction may pass",
      "The road is one-way",
    ],
    correctIndex: 2,
    explanation:
      "A double solid yellow line means passing is prohibited in both directions.",
  },
  {
    id: "q39",
    question: "How should you position your vehicle when preparing to make a right turn?",
    answers: [
      "Stay in the center of the lane",
      "Move to the left side of your lane",
      "Move to the far right of the lane",
      "Straddle two lanes",
    ],
    correctIndex: 2,
    explanation:
      "Before a right turn, move to the far right portion of the lane to complete the turn safely.",
  },
  {
    id: "q40",
    question: "What is the primary risk of distracted driving?",
    answers: [
      "Higher fuel consumption",
      "Increased tire wear",
      "Reduced awareness and slower reaction time",
      "Overheating the engine",
    ],
    correctIndex: 2,
    explanation:
      "Distracted driving reduces awareness of the road and slows reaction time, increasing the risk of a crash.",
  },
  {
    id: "q41",
    question: "When parked facing downhill with a curb, which way should you turn your front wheels?",
    answers: [
      "Straight ahead",
      "Away from the curb",
      "Into the curb",
      "Direction does not matter",
    ],
    correctIndex: 2,
    explanation:
      "When parked downhill next to a curb, turn the front wheels into the curb so the vehicle rolls into it if it moves.",
  },
  {
    id: "q42",
    question: "What does a pennant-shaped sign indicate?",
    answers: [
      "A school zone ahead",
      "A no-passing zone",
      "A divided highway begins",
      "A sharp curve warning",
    ],
    correctIndex: 1,
    explanation:
      "A pennant-shaped yellow sign marks the beginning of a no-passing zone.",
  },
  {
    id: "q43",
    question: "In New Jersey, what must a driver do when approaching a stationary emergency vehicle with lights activated on the side of the road?",
    answers: [
      "Speed up to clear the area quickly",
      "Slow down and move over a lane if safe to do so",
      "Continue at normal speed in the right lane",
      "Stop completely until the vehicle leaves",
    ],
    correctIndex: 1,
    explanation:
      "New Jersey's Move Over law requires drivers to slow down and change lanes away from stationary emergency or utility vehicles when it is safe to do so.",
  },
  {
    id: "q44",
    question: "What is the safest way to drive through a large puddle or flooded section of road?",
    answers: [
      "Drive through at full speed to get past quickly",
      "Avoid it if possible; if not, drive slowly and test brakes after",
      "Accelerate halfway through to avoid stalling",
      "Drive through with high beams on",
    ],
    correctIndex: 1,
    explanation:
      "When a flooded section cannot be avoided, drive slowly through it and gently test your brakes afterward to restore normal stopping ability.",
  },
  {
    id: "q45",
    question: "What does it mean when white pavement markings are solid?",
    answers: [
      "Lane changes are encouraged",
      "Passing is required",
      "Lane changes should not be made",
      "The road is about to end",
    ],
    correctIndex: 2,
    explanation:
      "Solid white lines indicate that lane changes should not be made in that area.",
  },
  {
    id: "q46",
    question: "What should you do if you are involved in a minor collision with no injuries?",
    answers: [
      "Drive away if damage seems small",
      "Move vehicles safely out of traffic if possible and exchange information",
      "Leave your car in the road and call police before moving anything",
      "Only report it if another driver requests it",
    ],
    correctIndex: 1,
    explanation:
      "In a minor collision, move vehicles out of traffic if possible to prevent further hazards, then exchange information and report as required.",
  },
  {
    id: "q47",
    question: "What is the safest way to enter a roundabout?",
    answers: [
      "Accelerate to merge ahead of traffic already in the circle",
      "Yield to vehicles already circulating, then enter when clear",
      "Stop inside the roundabout to let other cars in",
      "Treat it like a four-way stop",
    ],
    correctIndex: 1,
    explanation:
      "When entering a roundabout, yield to vehicles already traveling in the circle, then enter when there is a safe gap.",
  },
  {
    id: "q48",
    question: "What is the minimum age to apply for a New Jersey examination permit?",
    answers: [
      "15",
      "15 and a half",
      "16",
      "17",
    ],
    correctIndex: 2,
    explanation:
      "In New Jersey, drivers must be at least 16 years old to apply for an examination permit.",
  },
  {
    id: "q49",
    question: "Under New Jersey GDL rules, what passenger restriction applies to a probationary license holder during the first year?",
    answers: [
      "No passengers allowed at any time",
      "Only immediate family members may ride during certain hours",
      "No more than one non-family passenger under 21 unless a parent is present",
      "Passengers are unrestricted immediately after passing the road test",
    ],
    correctIndex: 2,
    explanation:
      "During the first year of a New Jersey probationary license, the holder may not transport more than one passenger under 21 who is not an immediate family member unless supervised by a licensed adult.",
  },
  {
    id: "q50",
    question: "What should you always do before backing out of a parking space?",
    answers: [
      "Honk twice to warn pedestrians",
      "Check all mirrors and look over both shoulders for people and vehicles",
      "Turn on hazard lights and reverse immediately",
      "Only check the rearview mirror",
    ],
    correctIndex: 1,
    explanation:
      "Before backing out, check all mirrors and physically look over both shoulders — mirrors alone have blind spots and may miss pedestrians or cyclists.",
  },
]