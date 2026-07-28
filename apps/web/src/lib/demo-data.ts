import type { Block, LessonSequence, MaterialKind } from "@pedagoos/pedagogy";

export const DEMO_ORG_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
export const DEMO_CLASS_ID = "4fa85f64-5717-4562-b3fc-2c963f66afa6";
export const DEMO_SEQUENCE_ID = "5fa85f64-5717-4562-b3fc-2c963f66afa6";

export const demoTeachers = [
  { profile_id: "6fa85f64-5717-4562-b3fc-2c963f66afa6", full_name: "Sarah Benhamou" },
  { profile_id: "7fa85f64-5717-4562-b3fc-2c963f66afa6", full_name: "David Cohen" },
];

export const demoStudents = [
  {
    id: "8fa85f64-5717-4562-b3fc-2c963f66afa6",
    first_name: "Lina",
    last_name: "Amar",
    schools: { name: "Ecole Devora Nissenbaum" },
  },
  {
    id: "9fa85f64-5717-4562-b3fc-2c963f66afa6",
    first_name: "Noam",
    last_name: "Bensimon",
    schools: { name: "Ecole Devora Nissenbaum" },
  },
  {
    id: "10a85f64-5717-4562-b3fc-2c963f66afa6",
    first_name: "Maya",
    last_name: "Elbaz",
    schools: { name: "Ecole Devora Nissenbaum" },
  },
  {
    id: "11a85f64-5717-4562-b3fc-2c963f66afa6",
    first_name: "Ethan",
    last_name: "Lévy",
    schools: { name: "Ecole Devora Nissenbaum" },
  },
  {
    id: "12a85f64-5717-4562-b3fc-2c963f66afa6",
    first_name: "Rachel",
    last_name: "Ohayon",
    schools: { name: "Ecole Devora Nissenbaum" },
  },
  {
    id: "13a85f64-5717-4562-b3fc-2c963f66afa6",
    first_name: "Gabriel",
    last_name: "Saada",
    schools: { name: "Ecole Devora Nissenbaum" },
  },
];

export const demoClasses = [
  {
    id: DEMO_CLASS_ID,
    name: "CM2 Aleph",
    grade_level: "cm2",
    archived_at: null,
    schools: { name: "Ecole Devora Nissenbaum" },
    academic_years: { label: "2026-2027" },
    subjects: { name: "Histoire" },
  },
  {
    id: "14a85f64-5717-4562-b3fc-2c963f66afa6",
    name: "6e Beth",
    grade_level: "sixieme",
    archived_at: null,
    schools: { name: "Ecole Devora Nissenbaum" },
    academic_years: { label: "2026-2027" },
    subjects: { name: "Français" },
  },
  {
    id: "15a85f64-5717-4562-b3fc-2c963f66afa6",
    name: "CE2 Guimel",
    grade_level: "ce2",
    archived_at: null,
    schools: { name: "Ecole Devora Nissenbaum" },
    academic_years: { label: "2026-2027" },
    subjects: { name: "Sciences" },
  },
];

export const demoClassDetail = {
  ...demoClasses[0],
  organization_id: DEMO_ORG_ID,
  teachers: demoTeachers,
  students: demoStudents.map(({ schools: _schools, ...student }) => student),
};

export const demoSources = [
  {
    id: "16a85f64-5717-4562-b3fc-2c963f66afa6",
    title: "Programme CM2 - Histoire et mémoire",
    language: "fr",
    grade_level: "cm2",
    tags: ["programme", "histoire", "cycle 3"],
    mime_type: "application/pdf",
    processing_status: "ready" as const,
    created_at: "2026-07-20T10:00:00.000Z",
    subjects: { name: "Histoire" },
    schools: { name: "Ecole Devora Nissenbaum" },
  },
  {
    id: "17a85f64-5717-4562-b3fc-2c963f66afa6",
    title: "Dossier documentaire - Vivre ensemble",
    language: "fr",
    grade_level: "cm2",
    tags: ["documents", "citoyenneté"],
    mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    processing_status: "ready" as const,
    created_at: "2026-07-18T14:30:00.000Z",
    subjects: { name: "EMC" },
    schools: null,
  },
  {
    id: "18a85f64-5717-4562-b3fc-2c963f66afa6",
    title: "Images et cartes - Paris au XIXe siècle",
    language: "fr",
    grade_level: "cm2",
    tags: ["cartes", "images"],
    mime_type: "application/pdf",
    processing_status: "processing" as const,
    created_at: "2026-07-16T08:15:00.000Z",
    subjects: { name: "Histoire" },
    schools: { name: "Ecole Devora Nissenbaum" },
  },
];

const objectiveUnderstand = "19a85f64-5717-4562-b3fc-2c963f66afa6";
const objectiveAnalyze = "20a85f64-5717-4562-b3fc-2c963f66afa6";
const objectiveCreate = "21a85f64-5717-4562-b3fc-2c963f66afa6";
const lessonOne = "22a85f64-5717-4562-b3fc-2c963f66afa6";
const lessonTwo = "23a85f64-5717-4562-b3fc-2c963f66afa6";
const lessonThree = "24a85f64-5717-4562-b3fc-2c963f66afa6";

export const demoLessonSequence: LessonSequence = {
  title: "Paris au XIXe siècle : transformations et vie quotidienne",
  theme:
    "Comprendre comment une ville se transforme et comment cela change la vie des habitants",
  language: "fr",
  objectives: [
    {
      id: objectiveUnderstand,
      title: "Identifier les grandes transformations d'une ville",
      description:
        "Repérer les changements visibles dans les rues, les transports et les lieux de vie.",
      bloomLevel: "understand",
      competencyIds: [],
      citations: [],
    },
    {
      id: objectiveAnalyze,
      title: "Comparer deux documents historiques",
      description:
        "Décrire les différences entre une carte ancienne, une photographie et un témoignage.",
      bloomLevel: "analyze",
      competencyIds: [],
      citations: [],
    },
    {
      id: objectiveCreate,
      title: "Construire une synthèse courte et argumentée",
      description: "Rédiger une réponse structurée avec un exemple tiré d'un document.",
      bloomLevel: "create",
      competencyIds: [],
      citations: [],
    },
  ],
  prerequisites: [
    {
      id: "25a85f64-5717-4562-b3fc-2c963f66afa6",
      label: "Lire une frise chronologique simple",
      checkSuggestion: "Faire replacer trois dates sur une ligne du temps.",
    },
  ],
  lessons: [
    {
      id: lessonOne,
      orderIndex: 0,
      title: "Observer la ville avant les transformations",
      summary: "Lecture guidée d'une carte et formulation des premières hypothèses.",
      durationMinutes: 55,
      objectiveIds: [objectiveUnderstand],
      phases: [],
    },
    {
      id: lessonTwo,
      orderIndex: 1,
      title: "Comparer les documents et expliquer les changements",
      summary: "Travail en binômes sur des documents visuels et textuels.",
      durationMinutes: 55,
      objectiveIds: [objectiveUnderstand, objectiveAnalyze],
      phases: [],
    },
    {
      id: lessonThree,
      orderIndex: 2,
      title: "Rédiger une synthèse d'historien",
      summary: "Production écrite courte, correction collective, puis différenciation.",
      durationMinutes: 55,
      objectiveIds: [objectiveCreate],
      phases: [],
    },
  ],
  citations: [],
  notes:
    "Démo : structure proposée pour montrer le parcours pédagogique de l'application.",
};

export const demoSequences = [
  {
    id: DEMO_SEQUENCE_ID,
    title: demoLessonSequence.title,
    theme: demoLessonSequence.theme,
    status: "materials_generated",
    created_at: "2026-07-22T09:00:00.000Z",
    classes: { name: "CM2 Aleph" },
  },
  {
    id: "26a85f64-5717-4562-b3fc-2c963f66afa6",
    title: "Lire un conte et repérer la morale",
    theme: "Compréhension fine et débat interprétatif",
    status: "structure_proposed",
    created_at: "2026-07-21T09:00:00.000Z",
    classes: { name: "6e Beth" },
  },
];

export const demoSequenceDetail = {
  id: DEMO_SEQUENCE_ID,
  organization_id: DEMO_ORG_ID,
  class_id: DEMO_CLASS_ID,
  title: demoLessonSequence.title,
  theme: demoLessonSequence.theme,
  language: "fr",
  grade_level_hint: "cm2",
  session_count: 3,
  session_duration_minutes: 55,
  difficulty: "standard" as const,
  status: "materials_generated",
  subject_name: "Histoire",
  wizardState: {
    desiredObjectives: demoLessonSequence.objectives.map((objective) => objective.title),
    prerequisites: demoLessonSequence.prerequisites.map((item) => item.label),
    constraints: ["Classe hétérogène", "Prévoir une trace écrite courte"],
    learningType: "Enquête documentaire guidée",
    differentiation:
      "Groupes de soutien avec documents annotés ; défi de synthèse pour les élèves avancés.",
    sourceIds: [demoSources[0]!.id, demoSources[2]!.id],
  },
  structure: demoLessonSequence,
};

export const demoMaterials = demoLessonSequence.lessons.flatMap((lesson, lessonIndex) =>
  (
    [
      ["teacher_guide", "Fiche professeur"],
      ["student_handout", "Support élève"],
      ["presentation", "Slides"],
      ["exercise_set", "Exercices"],
    ] as [MaterialKind, string][]
  ).map(([kind, label], index) => ({
    id: `${lessonIndex + 3}${index + 1}a85f64-5717-4562-b3fc-2c963f66afa6`,
    lesson_id: lesson.id,
    kind,
    title: `${label} - ${lesson.title}`,
    status: index === 0 ? "validated" : "draft",
    current_version: 1,
    locked: index === 0,
    updated_at: "2026-07-22T11:00:00.000Z",
  })),
);

function blockId(seed: number): string {
  return `${String(seed).padStart(8, "0")}-0000-4000-8000-${String(seed).padStart(12, "0")}`;
}

function buildDemoBlocks(lessonIndex: number, kind: MaterialKind): Block[] {
  const lesson = demoLessonSequence.lessons[lessonIndex]!;
  const objectiveIds = lesson.objectiveIds;
  const objectiveItems = demoLessonSequence.objectives
    .filter((objective) => objectiveIds.includes(objective.id))
    .map((objective) => ({ objectiveId: objective.id, label: objective.title }));
  const base = (offset: number) => lessonIndex * 100 + offset;

  if (kind === "teacher_guide") {
    return [
      {
        id: blockId(base(1)),
        type: "objectives",
        audience: "both",
        answerKey: false,
        objectiveIds,
        locked: true,
        items: objectiveItems,
      },
      {
        id: blockId(base(2)),
        type: "timeline_step",
        audience: "teacher",
        answerKey: false,
        objectiveIds,
        locked: true,
        index: 0,
        title: "Mise en route",
        durationMinutes: 10,
        teacherNote:
          "Afficher une image ou une carte de Paris, puis demander aux élèves ce qu'ils remarquent avant toute explication.",
        studentNote: "Observe le document et note deux détails importants.",
      },
      {
        id: blockId(base(3)),
        type: "timeline_step",
        audience: "teacher",
        answerKey: false,
        objectiveIds,
        locked: true,
        index: 1,
        title: "Recherche guidée",
        durationMinutes: 30,
        teacherNote:
          "Faire travailler les élèves en binômes. Circuler avec une grille simple : lieu, changement observé, preuve dans le document.",
        studentNote: "Travaille avec ton binôme et complète la fiche d'observation.",
      },
      {
        id: blockId(base(4)),
        type: "differentiation",
        audience: "teacher",
        answerKey: false,
        objectiveIds,
        locked: true,
        level: "support",
        description:
          "Pour les élèves fragiles, donner trois mots-clés et une phrase à compléter. Pour les élèves avancés, demander une comparaison avec leur ville actuelle.",
      },
      {
        id: blockId(base(5)),
        type: "expected_answer",
        audience: "teacher",
        answerKey: true,
        objectiveIds,
        locked: true,
        answer:
          "On attend une réponse qui cite au moins un changement visible, l'appuie sur un document et explique une conséquence sur la vie quotidienne.",
        acceptableVariations: [
          "Réponse orale structurée",
          "Phrase écrite courte avec exemple",
        ],
        epistemic: "fact",
        citations: [],
      },
    ];
  }

  if (kind === "student_handout") {
    return [
      {
        id: blockId(base(21)),
        type: "objectives",
        audience: "student",
        answerKey: false,
        objectiveIds,
        locked: false,
        items: objectiveItems,
      },
      {
        id: blockId(base(22)),
        type: "explanation",
        audience: "student",
        answerKey: false,
        objectiveIds,
        locked: false,
        title: "Ce que je dois comprendre",
        body: "Une ville change avec le temps. Les rues, les bâtiments, les transports et les habitudes des habitants peuvent être transformés par des décisions politiques, économiques ou sociales.",
        epistemic: "fact",
        citations: [],
      },
      {
        id: blockId(base(23)),
        type: "exercise",
        audience: "student",
        answerKey: false,
        objectiveIds,
        locked: false,
        title: "J'observe un document",
        category: "analysis",
        difficulty: 2,
        statement:
          "Regarde le document proposé par le professeur. Écris trois éléments que tu vois, puis indique ce qui te semble ancien ou nouveau.",
        expectedAnswer:
          "L'élève cite trois éléments visibles et justifie au moins une observation.",
        citations: [],
      },
      {
        id: blockId(base(24)),
        type: "answer_space",
        audience: "student",
        answerKey: false,
        objectiveIds,
        locked: false,
        label: "Ma réponse",
        lines: 7,
      },
      {
        id: blockId(base(25)),
        type: "summary",
        audience: "student",
        answerKey: false,
        objectiveIds,
        locked: false,
        points: [
          "Je décris ce que je vois.",
          "Je compare deux périodes.",
          "J'explique une conséquence pour les habitants.",
        ],
      },
    ];
  }

  if (kind === "presentation") {
    return [
      {
        id: blockId(base(31)),
        type: "slide",
        audience: "both",
        answerKey: false,
        objectiveIds,
        locked: false,
        title: lesson.title,
        bullets: [
          "Question de départ : que voit-on dans le document ?",
          "Objectif : repérer un changement important.",
          "À la fin : chacun formule une phrase de synthèse.",
        ],
        speakerNotes:
          "Lancer avec une observation silencieuse de 30 secondes avant les prises de parole.",
      },
      {
        id: blockId(base(32)),
        type: "slide",
        audience: "both",
        answerKey: false,
        objectiveIds,
        locked: false,
        title: "Méthode d'observation",
        bullets: [
          "Je décris précisément ce que je vois.",
          "Je compare avec ce que je connais.",
          "Je justifie mon idée avec un détail du document.",
        ],
        speakerNotes: "Faire reformuler la méthode par un élève avant l'activité.",
      },
      {
        id: blockId(base(33)),
        type: "slide",
        audience: "both",
        answerKey: false,
        objectiveIds,
        locked: false,
        title: "Trace écrite",
        bullets: [
          "Paris se transforme au XIXe siècle.",
          "Les changements touchent les rues, les transports et les habitants.",
          "Un historien explique avec des preuves.",
        ],
        speakerNotes:
          "Garder cette diapositive affichée pendant la copie ou la reformulation.",
      },
    ];
  }

  return [
    {
      id: blockId(base(41)),
      type: "exercise",
      audience: "student",
      answerKey: false,
      objectiveIds,
      locked: false,
      title: "Exercice 1",
      category: "comprehension",
      difficulty: 2,
      statement:
        "Explique en deux phrases comment une transformation de la ville peut changer la vie des habitants.",
      expectedAnswer:
        "Une transformation modifie les déplacements, le logement ou les activités. Elle peut rendre la vie plus pratique, mais aussi déplacer certains habitants.",
      citations: [],
    },
    {
      id: blockId(base(42)),
      type: "answer_space",
      audience: "student",
      answerKey: false,
      objectiveIds,
      locked: false,
      label: "Réponse",
      lines: 5,
    },
    {
      id: blockId(base(43)),
      type: "expected_answer",
      audience: "teacher",
      answerKey: true,
      objectiveIds,
      locked: false,
      answer:
        "La réponse doit relier un changement concret à une conséquence pour les habitants.",
      acceptableVariations: [],
      epistemic: "fact",
      citations: [],
    },
  ];
}

export function getDemoMaterialDetail(materialId: string) {
  const material = demoMaterials.find((item) => item.id === materialId);
  if (!material) return null;
  const lessonIndex = demoLessonSequence.lessons.findIndex(
    (lesson) => lesson.id === material.lesson_id,
  );
  return {
    ...material,
    organization_id: DEMO_ORG_ID,
    sequence_id: DEMO_SEQUENCE_ID,
    blocks: buildDemoBlocks(Math.max(lessonIndex, 0), material.kind),
  };
}
