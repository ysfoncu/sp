// What the info banner of each placement step says: the user's task and how to do it. Only the mandatory steps have one.
// Keyed by task id (placementTask.ts): "1" is Placement Details, "2" the entities, "4" placing the students,
// "7" publishing to entities, "8" publishing to students. The optional steps (documents "5", mentors "6") have none.
export interface StepInfo {
  heading: string; // after "Step N of M: "
  task: string; // what the user is to do
  points: string[]; // how
}

export const STEP_INFO: Record<string, StepInfo> = {
  "1": {
    heading: "choose the study, program and emne",
    task: "Your task is to say which students this placement is for. The students waiting for that emne come in automatically from Praksis-students.",
    points: [
      "Choose the study, program and emne. All three are required.",
      "Optionally choose a location to take only the waiting students who study there.",
      "Press Continue. The placement takes the waiting students, and its period follows theirs.",
      "Next you choose the entities and slots. Only entities that accept the program and emne are offered.",
    ],
  },
  "2": {
    heading: "choose the entities for this placement",
    task: "Your task is to decide which entities take students in this placement and how many slots each one gives it.",
    points: [
      "Press Add on the entities in the list on the right. They move to the left panel.",
      "Set the slots for each chosen entity. A new entity starts with the places it has free.",
      'Slots guide you and never block: you can still place more students than slots, and the entity then shows "over by N".',
      "You can continue without any entity and add them later with Change entities. Then you place the students.",
    ],
  },
  "4": {
    heading: "place the students on entities",
    task: "Your task is to place every student on one of the chosen entities.",
    points: [
      'Press the + on an entity, tick the students in the table and press "Add N to <entity>". Or tick the students first and choose the entity.',
      'Use "Top N by points" in the bar at the bottom to pick the students with the most priority points.',
      'Places never block: more students than slots shows "over by N". Use Change entities to add entities or slots.',
      "When every student is placed, the publish steps open above the list.",
    ],
  },
  // Creating a priority list: step 1 chooses the students' group, step 2 has the priority details
  p1: {
    heading: "choose the study, program and emne",
    task: "Your task is to say which students this priority list is for. The students come from Praksis-students.",
    points: [
      "Choose the study, program and emne. All three are required.",
      "Optionally choose a location to take only the students who study there.",
      "Press Continue. The list takes the students from Praksis-students, and its period follows their praksis dates.",
      "Next you set the dates and the message for the students.",
    ],
  },
  p2: {
    heading: "set the priority details",
    task: "Your task is to say when the students are told and when their applications are due, and what they are told.",
    points: [
      "The noticing students date and the application deadline are optional. You can set them later in the list.",
      "Write the message the students get. It is required.",
      "Press Create priority list. Back returns to your choices.",
    ],
  },
  "7": {
    heading: "publish to entities",
    task: "Your task is to tell the entities which students will come to them.",
    points: [
      'Check the placements, then press "Publish to entities" in the banner below.',
      "This records that the entities can see the placement (their side is not built in this prototype) and locks the assignments. Use Edit to unlock them.",
      "The students are not told yet. That is the next step.",
    ],
  },
  "8": {
    heading: "publish to students",
    task: "Your task is to tell the students where they are placed.",
    points: [
      'Use "Preview what students receive" to see what each student will get.',
      'Press "Publish to students". The assignments become booked and what each student is told is frozen.',
      "You can edit later with Edit and send updates.",
    ],
  },
};

// The step's heading line, from its step label ("3/7") and heading text
export const stepInfoTitle = (stepLabel: string, info: StepInfo) => {
  const [n, total] = stepLabel.split("/");
  return `Step ${n} of ${total}: ${info.heading}`;
};
