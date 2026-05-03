// src/data/practiceQuestions.ts
// Full question bank — 50 questions (q1–q50)
// Each question: id, question, answers[4], correctIndex, explanation

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
    question: "What is the speed limit in a school zone when children are present?",
    answers: [
      "25 mph",
      "15 mph",
      "35 mph",
      "20 mph",
    ],
    correctIndex: 1,
    explanation:
      "In New Jersey, the speed limit in a school zone when children are present is 15 mph unless otherwise posted.",
  },
  {
    id: "q2",
    question: "When must you use your headlights in New Jersey?",
    answers: [
      "Only at night",
      "From one-half hour after sunset to one-half hour before sunrise, and when visibility is less than 500 feet",
      "Only in rain or fog",
      "Only on highways",
    ],
    correctIndex: 1,
    explanation:
      "NJ law requires headlights from half an hour after sunset to half an hour before sunrise and whenever visibility drops below 500 feet.",
  },
  {
    id: "q3",
    question: "What does a flashing red traffic light mean?",
    answers: [
      "Slow down and proceed with caution",
      "Stop completely, then proceed when safe",
      "Yield to oncoming traffic",
      "The light is about to turn green",
    ],
    correctIndex: 1,
    explanation:
      "A flashing red light is treated the same as a stop sign — you must come to a complete stop before proceeding.",
  },
  {
    id: "q4",
    question: "In New Jersey, what is the maximum speed limit on most interstate highways?",
    answers: [
      "55 mph",
      "60 mph",
      "65 mph",
      "70 mph",
    ],
    correctIndex: 2,
    explanation:
      "The maximum posted speed limit on most NJ interstate highways is 65 mph. Some sections allow 55 mph.",
  },
  {
    id: "q5",
    question: "When approaching a school bus with flashing red lights stopped on a two-lane road, you must:",
    answers: [
      "Slow to 10 mph and pass carefully",
      "Stop and remain stopped until the lights stop flashing",
      "Pass only if no children are visible",
      "Honk and proceed slowly",
    ],
    correctIndex: 1,
    explanation:
      "NJ law requires all drivers to stop for a school bus with flashing red lights and not move until the lights stop and the stop arm retracts.",
  },
  {
    id: "q6",
    question: "What does a yellow diamond-shaped sign indicate?",
    answers: [
      "A regulatory requirement",
      "A warning of a hazard or change in road conditions ahead",
      "A direction to stop",
      "A school zone",
    ],
    correctIndex: 1,
    explanation:
      "Yellow diamond signs are warning signs — they alert drivers to potential hazards or changes ahead.",
  },
  {
    id: "q7",
    question: "You must yield to pedestrians in a crosswalk:",
    answers: [
      "Only when they are directly in front of your vehicle",
      "Only if there is a crossing guard",
      "At all times",
      "Only at marked crosswalks",
    ],
    correctIndex: 2,
    explanation:
      "NJ law requires drivers to yield to pedestrians in crosswalks, whether marked or unmarked, at all times.",
  },
  {
    id: "q8",
    question: "What is the legal blood alcohol content (BAC) limit for drivers 21 and older in New Jersey?",
    answers: [
      "0.10%",
      "0.08%",
      "0.05%",
      "0.06%",
    ],
    correctIndex: 1,
    explanation:
      "The legal BAC limit in New Jersey for drivers 21 and older is 0.08%. For drivers under 21, the limit is 0.01%.",
  },
  {
    id: "q9",
    question: "When you see a solid white line along the right edge of a highway, it means:",
    answers: [
      "You may pass slower vehicles",
      "The edge of the travel lane — do not cross except in an emergency",
      "A bicycle lane begins",
      "Parking is permitted",
    ],
    correctIndex: 1,
    explanation:
      "A solid white edge line marks the boundary of the travel lane. You should not cross it except in a genuine emergency.",
  },
  {
    id: "q10",
    question: "On a two-lane road, a solid yellow center line on your side means:",
    answers: [
      "Passing is permitted when safe",
      "No passing is allowed from your side",
      "You must slow down",
      "The road narrows ahead",
    ],
    correctIndex: 1,
    explanation:
      "A solid yellow line on your side of the road means no passing from that side. You must stay in your lane.",
  },
  {
    id: "q11",
    question: "What does a green arrow on a traffic signal mean?",
    answers: [
      "Proceed with caution in any direction",
      "You may move in the direction the arrow points, and oncoming traffic is stopped",
      "Yield to oncoming traffic before turning",
      "Pedestrians have the right of way",
    ],
    correctIndex: 1,
    explanation:
      "A green arrow (protected signal) means you may proceed in that direction and conflicting traffic has a red light.",
  },
  {
    id: "q12",
    question: "When parallel parking, you should be no more than how far from the curb?",
    answers: [
      "6 inches",
      "12 inches",
      "18 inches",
      "24 inches",
    ],
    correctIndex: 1,
    explanation:
      "In New Jersey, when parallel parked, your vehicle must be no more than 12 inches from the curb.",
  },
  {
    id: "q13",
    question: "You are driving on the highway and want to merge. You should:",
    answers: [
      "Stop at the end of the on-ramp and wait for a gap",
      "Match the speed of highway traffic and merge smoothly into a gap",
      "Force your way in and let others slow down",
      "Always use the left lane to merge",
    ],
    correctIndex: 1,
    explanation:
      "Merging requires matching highway speed and finding a safe gap — stopping on the ramp creates danger.",
  },
  {
    id: "q14",
    question: "What should you do when an emergency vehicle approaches with lights and siren on?",
    answers: [
      "Speed up to get out of the way quickly",
      "Pull to the right and stop until it passes",
      "Continue at the same speed",
      "Move to the left lane",
    ],
    correctIndex: 1,
    explanation:
      "NJ law requires drivers to pull to the right and stop for emergency vehicles with active lights and sirens.",
  },
  {
    id: "q15",
    question: "In New Jersey, a new driver with a probationary license may not drive between:",
    answers: [
      "10 PM and 5 AM (under 21)",
      "11 PM and 5 AM (under 21)",
      "Midnight and 6 AM (under 21)",
      "9 PM and 6 AM (under 21)",
    ],
    correctIndex: 1,
    explanation:
      "NJ GDL probationary drivers under 21 are prohibited from driving between 11:01 PM and 5 AM unless an exception applies.",
  },
  {
    id: "q16",
    question: "What is the minimum following distance recommended behind the car ahead?",
    answers: [
      "One car length",
      "Two seconds",
      "Three seconds",
      "Five car lengths",
    ],
    correctIndex: 2,
    explanation:
      "The three-second rule is a standard minimum following distance. Add more time in poor conditions.",
  },
  {
    id: "q17",
    question: "What does a red octagonal sign always mean?",
    answers: [
      "Yield",
      "Slow down",
      "Stop",
      "Do not enter",
    ],
    correctIndex: 2,
    explanation:
      "A red octagon is exclusively the shape and color of a Stop sign. You must come to a complete stop.",
  },
  {
    id: "q18",
    question: "When turning left at an intersection, you must yield to:",
    answers: [
      "No one — left turns have priority",
      "Oncoming traffic and pedestrians in the crosswalk",
      "Only pedestrians",
      "Only oncoming traffic going straight",
    ],
    correctIndex: 1,
    explanation:
      "Left-turning drivers must yield to oncoming vehicles and to pedestrians crossing the street you are turning onto.",
  },
  {
    id: "q19",
    question: "It is illegal to use a hand-held cell phone while driving in New Jersey unless:",
    answers: [
      "You are driving under 25 mph",
      "You are reporting an emergency",
      "You have a Bluetooth earpiece",
      "You are on a rural road",
    ],
    correctIndex: 1,
    explanation:
      "NJ law bans hand-held device use while driving. The only exception is calling 911 or emergency services.",
  },
  {
    id: "q20",
    question: "What does a pennant-shaped yellow sign mean?",
    answers: [
      "Railroad crossing ahead",
      "No passing zone",
      "Divided highway begins",
      "Speed limit ahead",
    ],
    correctIndex: 1,
    explanation:
      "The pennant (triangular pointing right) shape is exclusively used for No Passing Zone signs.",
  },
  {
    id: "q21",
    question: "When roads are wet or slippery, you should:",
    answers: [
      "Maintain normal speed",
      "Increase following distance and reduce speed",
      "Use cruise control to maintain consistent speed",
      "Stay closer to the vehicle ahead for guidance",
    ],
    correctIndex: 1,
    explanation:
      "Slippery roads require more stopping distance. Reduce speed and increase the gap between you and the car ahead.",
  },
  {
    id: "q22",
    question: "A driver must give a turn signal at least how far before turning?",
    answers: [
      "50 feet",
      "100 feet",
      "200 feet",
      "25 feet",
    ],
    correctIndex: 1,
    explanation:
      "NJ law requires signaling at least 100 feet before turning or changing lanes.",
  },
  {
    id: "q23",
    question: "What does a triangular red and white Yield sign mean?",
    answers: [
      "Come to a complete stop",
      "Slow down and give the right of way to crossing traffic",
      "Proceed at normal speed",
      "Stop only if traffic is heavy",
    ],
    correctIndex: 1,
    explanation:
      "A Yield sign means slow down and be prepared to stop to give the right of way to pedestrians and vehicles.",
  },
  {
    id: "q24",
    question: "In New Jersey, you must report a crash to the police when:",
    answers: [
      "Any vehicle is damaged",
      "There is injury, death, or property damage of $500 or more",
      "Only when someone is hurt",
      "Only when the other driver demands it",
    ],
    correctIndex: 1,
    explanation:
      "NJ requires reporting a crash when there is injury, death, or property damage of $500 or more.",
  },
  {
    id: "q25",
    question: "What is the purpose of rumble strips on the shoulder of a highway?",
    answers: [
      "To mark the speed limit zone",
      "To alert drivers who drift off the road with vibration and noise",
      "To guide trucks to the shoulder",
      "To indicate a rest area ahead",
    ],
    correctIndex: 1,
    explanation:
      "Rumble strips create noise and vibration to warn drivers that they are drifting off the roadway.",
  },
  {
    id: "q26",
    question: "A flashing yellow traffic light means:",
    answers: [
      "Stop completely before proceeding",
      "Slow down and proceed with caution",
      "The light is about to turn red",
      "Yield to all crossing traffic",
    ],
    correctIndex: 1,
    explanation:
      "A flashing yellow light is a caution signal — reduce speed and look for hazards before proceeding.",
  },
  {
    id: "q27",
    question: "When parking on a hill facing uphill with a curb, turn your wheels:",
    answers: [
      "Straight ahead",
      "Away from the curb (left)",
      "Toward the curb (right)",
      "It does not matter",
    ],
    correctIndex: 1,
    explanation:
      "Facing uphill with a curb, turn wheels left (away from curb) so the car rolls back into the curb if brakes fail.",
  },
  {
    id: "q28",
    question: "What does a double solid yellow center line mean?",
    answers: [
      "Passing is allowed in both directions when safe",
      "No passing in either direction",
      "Passing allowed only from the left lane",
      "A divided highway begins",
    ],
    correctIndex: 1,
    explanation:
      "Double solid yellow lines prohibit passing in either direction.",
  },
  {
    id: "q29",
    question: "At a four-way stop, who goes first?",
    answers: [
      "The driver going straight always goes first",
      "The driver who arrived first; if simultaneous, the driver to the right",
      "The driver on the larger road",
      "The driver turning left",
    ],
    correctIndex: 1,
    explanation:
      "At a four-way stop, the first to arrive goes first. When two arrive at the same time, yield to the driver on your right.",
  },
  {
    id: "q30",
    question: "Hydroplaning occurs when:",
    answers: [
      "Your engine overheats in hot weather",
      "Your tires lose contact with the road surface due to water buildup",
      "You brake too hard on dry pavement",
      "Fog reduces visibility to near zero",
    ],
    correctIndex: 1,
    explanation:
      "Hydroplaning happens when water builds up between tires and the road, causing loss of traction and steering control.",
  },
  {
    id: "q31",
    question: "What is the correct action when your vehicle starts to skid?",
    answers: [
      "Brake hard and turn sharply opposite the skid",
      "Ease off the gas and steer in the direction you want to go",
      "Accelerate to regain traction",
      "Shift into neutral immediately",
    ],
    correctIndex: 1,
    explanation:
      "In a skid, ease off the accelerator and steer gently in the direction you want the vehicle to go. Avoid sharp braking.",
  },
  {
    id: "q32",
    question: "Driving while under the influence of prescribed medication that impairs your ability is:",
    answers: [
      "Legal if the medication was prescribed by a doctor",
      "Illegal — any impairment while driving is prohibited",
      "Legal if you drive below the speed limit",
      "Only illegal for drivers under 21",
    ],
    correctIndex: 1,
    explanation:
      "Driving impaired by any substance — including prescribed medications — is illegal in New Jersey.",
  },
  {
    id: "q33",
    question: "The Move Over Law in New Jersey requires drivers to:",
    answers: [
      "Speed up to pass emergency vehicles quickly",
      "Move over one lane or slow down when passing stopped emergency or roadside vehicles with lights on",
      "Stop completely anytime an emergency vehicle is on the shoulder",
      "Only yield if the vehicle is a police car",
    ],
    correctIndex: 1,
    explanation:
      "NJ Move Over Law requires drivers to move a lane away from stopped emergency, law enforcement, tow trucks, and utility vehicles with active lights when safe to do so.",
  },
  {
    id: "q34",
    question: "What does it mean when the pavement has a white diamond painted on it?",
    answers: [
      "Hazardous intersection ahead",
      "A dedicated lane for high-occupancy vehicles or bicycles",
      "A pedestrian crossing zone",
      "Increased speed zone",
    ],
    correctIndex: 1,
    explanation:
      "A white diamond on the pavement indicates a lane reserved for a specific use — typically HOV or bicycle traffic.",
  },
  {
    id: "q35",
    question: "When should you use your horn?",
    answers: [
      "To greet friends on the road",
      "Only when necessary to avoid a collision or warn others of danger",
      "Whenever you want to signal your presence",
      "Every time you approach an intersection",
    ],
    correctIndex: 1,
    explanation:
      "The horn should be used only when necessary for safety — not for expressing frustration or greeting others.",
  },
  {
    id: "q36",
    question: "A solid white line between lanes of traffic moving in the same direction means:",
    answers: [
      "Passing is encouraged",
      "Lane changes should be made with caution; you should not cross it unnecessarily",
      "The lane is for buses only",
      "You must exit the roadway ahead",
    ],
    correctIndex: 1,
    explanation:
      "Solid white lines between same-direction lanes discourage lane changes and warn of a hazard or restricted area ahead.",
  },
  {
    id: "q37",
    question: "What is the safest way to check your blind spots before changing lanes?",
    answers: [
      "Only use the rearview mirror",
      "Quickly glance over your shoulder in addition to checking mirrors",
      "Rely entirely on your side mirrors",
      "Sound your horn and proceed",
    ],
    correctIndex: 1,
    explanation:
      "Mirrors alone do not cover blind spots. A quick over-the-shoulder glance is essential before changing lanes.",
  },
  {
    id: "q38",
    question: "When you see a railroad crossing with flashing lights and gates lowering, you must:",
    answers: [
      "Speed up to cross before the gate fully lowers",
      "Stop at least 15 feet from the nearest rail and wait",
      "Yield only if a train is visible",
      "Treat it like a yield sign",
    ],
    correctIndex: 1,
    explanation:
      "When a railroad crossing activates, stop at least 15 feet from the nearest track and wait until it is fully clear.",
  },
  {
    id: "q39",
    question: "What is the first thing you should do when your accelerator sticks while driving?",
    answers: [
      "Turn off the ignition immediately",
      "Shift to neutral and apply the brakes, then safely steer off the road",
      "Pump the gas pedal repeatedly",
      "Swerve sharply to reduce speed",
    ],
    correctIndex: 1,
    explanation:
      "If the accelerator sticks, shift to neutral and brake to slow down. Do not turn off the ignition while moving as it can lock the steering.",
  },
  {
    id: "q40",
    question: "If your brakes suddenly fail, you should first:",
    answers: [
      "Turn off the engine immediately",
      "Pump the brake pedal and shift to a lower gear",
      "Jump from the vehicle",
      "Accelerate to avoid traffic",
    ],
    correctIndex: 1,
    explanation:
      "If brakes fail, pump the pedal, downshift if possible, and steer to a safe area.",
  },
  {
    id: "q41",
    question: "If a tire blows out while driving, you should:",
    answers: [
      "Brake hard immediately",
      "Grip the wheel firmly and gradually slow down",
      "Turn sharply off the road",
      "Shift into park",
    ],
    correctIndex: 1,
    explanation:
      "A blowout requires a calm response: hold the wheel firmly and reduce speed gradually.",
  },
  {
    id: "q42",
    question: "When driving in fog, the best lights to use are:",
    answers: [
      "High beams",
      "Parking lights only",
      "Low beams",
      "Hazard lights only",
    ],
    correctIndex: 2,
    explanation:
      "Low beams help you see and reduce glare in fog better than high beams.",
  },
  {
    id: "q43",
    question: "The safest thing to do if you become drowsy while driving is to:",
    answers: [
      "Open the window and keep driving",
      "Turn up the radio",
      "Pull over in a safe place and rest",
      "Drive faster to get home sooner",
    ],
    correctIndex: 2,
    explanation:
      "Drowsy driving is dangerous; the safest choice is to stop and rest.",
  },
  {
    id: "q44",
    question: "A driver should lower speed when:",
    answers: [
      "Approaching curves and hill crests",
      "The road is empty",
      "Driving with friends",
      "Traveling in daylight",
    ],
    correctIndex: 0,
    explanation:
      "Curves and hill crests reduce visibility and increase the need for controlled speed.",
  },
  {
    id: "q45",
    question: "When another driver is tailgating you, the best response is to:",
    answers: [
      "Brake suddenly",
      "Speed up well over the limit",
      "Move over or allow extra space ahead",
      "Block them from passing",
    ],
    correctIndex: 2,
    explanation:
      "Avoid escalating the situation; create more space and let the aggressive driver pass if possible.",
  },
  {
    id: "q46",
    question: "Seat belts should be worn:",
    answers: [
      "Only on highways",
      "Only by front-seat passengers",
      "By everyone in the vehicle",
      "Only when traveling over 25 mph",
    ],
    correctIndex: 2,
    explanation:
      "Seat belts protect all occupants and should be used by everyone in the vehicle.",
  },
  {
    id: "q47",
    question: "Children should be secured:",
    answers: [
      "According to age and size in proper restraint systems",
      "Only with an adult seat belt",
      "In the front seat if they are calm",
      "Without restraints on short trips",
    ],
    correctIndex: 0,
    explanation:
      "Child passengers should be properly restrained based on their age, height, weight, and applicable law.",
  },
  {
    id: "q48",
    question: "What should you do before changing lanes?",
    answers: [
      "Check mirrors and blind spots, then signal",
      "Only look in the rearview mirror",
      "Honk and move immediately",
      "Accelerate first and check later",
    ],
    correctIndex: 0,
    explanation:
      "A safe lane change requires mirrors, blind-spot checks, and a signal before moving.",
  },
  {
    id: "q49",
    question: "If you are involved in a crash with injury, death, or significant property damage, you should:",
    answers: [
      "Leave if your car still runs",
      "Stop and report the crash as required",
      "Move your vehicle and say nothing",
      "Only exchange first names",
    ],
    correctIndex: 1,
    explanation:
      "Certain collisions must be reported, and you must stop and handle the incident lawfully.",
  },
  {
    id: "q50",
    question: "The best source to study for the NJ knowledge test is:",
    answers: [
      "Only social media posts",
      "Only a friend's memory of the test",
      "The official New Jersey Driver Manual and sample test topics",
      "Random internet comments",
    ],
    correctIndex: 2,
    explanation:
      "The best study source is the official New Jersey Driver Manual and official knowledge-test guidance.",
  },
]