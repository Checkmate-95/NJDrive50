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
]