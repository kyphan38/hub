// The apps on the home page. Icons are 24x24 single-stroke marks (DESIGN.md).

export type GroupId = 'daily' | 'learn' | 'tools';

export type AppItem = {
  name: string;
  href: string;
  desc: string;
  domain: string;
  /** Inner SVG markup, drawn in currentColor. */
  icon: string;
};

export type AppGroup = { id: GroupId; title: string; apps: AppItem[] };

export const GROUPS: AppGroup[] = [
  {
    id: 'daily',
    title: 'Daily',
    apps: [
      {
        name: 'fina',
        href: 'https://fina.kyphan38.com',
        desc: "Money in, money out, and a monthly budget.",
        domain: 'fina.kyphan38.com',
        icon: "<circle cx=\"12\" cy=\"12\" r=\"8\" stroke-dasharray=\"30 5.2 11 4.1\" transform=\"rotate(-90 12 12)\"/> <circle cx=\"12\" cy=\"12\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/>",
      },
      {
        name: 'hodi',
        href: 'https://hodi.kyphan38.com',
        desc: "A daily journal. Today's page is ready.",
        domain: 'hodi.kyphan38.com',
        icon: "<path pathLength=\"1\" d=\"M2.5 12.5c1.3-3.3 3.4-3.3 4.7 0s3.4 3.3 4.7 0 3.4-3.3 4.7 0\"/> <circle cx=\"20.6\" cy=\"15.2\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/>",
      },
      {
        name: 'legi',
        href: 'https://legi.kyphan38.com',
        desc: "Quotes from the books you read.",
        domain: 'legi.kyphan38.com',
        icon: "<rect x=\"3\" y=\"14.5\" width=\"17\" height=\"4.5\" rx=\"1\"/> <rect x=\"5.5\" y=\"10\" width=\"15.5\" height=\"4.5\" rx=\"1\"/> <rect x=\"4\" y=\"5.5\" width=\"13.5\" height=\"4.5\" rx=\"1\"/>",
      },
      {
        name: 'logi',
        href: 'https://logi.kyphan38.com',
        desc: "Speak your day, get a clean time log.",
        domain: 'logi.kyphan38.com',
        icon: "<line x1=\"5\" y1=\"9.5\" x2=\"5\" y2=\"14.5\"/> <line x1=\"9.7\" y1=\"6\" x2=\"9.7\" y2=\"18\"/> <line x1=\"14.3\" y1=\"8.5\" x2=\"14.3\" y2=\"15.5\"/> <line x1=\"19\" y1=\"4.5\" x2=\"19\" y2=\"19.5\"/>",
      },
    ],
  },
  {
    id: 'learn',
    title: 'Learn',
    apps: [
      {
        name: 'arca',
        href: 'https://arca.kyphan38.com',
        desc: "Study notes, tech write-ups, and interview prep.",
        domain: 'arca.kyphan38.com',
        icon: "<line x1=\"4\" y1=\"6\" x2=\"15\" y2=\"6\"/> <line x1=\"4\" y1=\"12\" x2=\"20\" y2=\"12\"/> <line x1=\"4\" y1=\"18\" x2=\"12\" y2=\"18\"/>",
      },
      {
        name: 'cogi',
        href: 'https://cogi.kyphan38.com',
        desc: "An AI coach for thinking, with short drills.",
        domain: 'cogi.kyphan38.com',
        icon: "<path d=\"M12 8.2v3.3\"/> <path d=\"M6.5 15V11.5h11V15\"/> <circle cx=\"12\" cy=\"6\" r=\"2\" fill=\"currentColor\" stroke=\"none\"/> <circle cx=\"6.5\" cy=\"17\" r=\"2\" fill=\"currentColor\" stroke=\"none\"/> <circle cx=\"17.5\" cy=\"17\" r=\"2\" fill=\"currentColor\" stroke=\"none\"/>",
      },
      {
        name: 'noda',
        href: 'https://noda.kyphan38.com',
        desc: "Dictation, shadowing, and flashcards.",
        domain: 'noda.kyphan38.com',
        icon: "<path d=\"M8 9.4a5 5 0 0 1 0 5.2\"/> <path d=\"M12.2 6.6a9.5 9.5 0 0 1 0 10.8\"/> <path d=\"M16.4 4a14 14 0 0 1 0 16\"/> <circle cx=\"4.4\" cy=\"12\" r=\"1.3\"/>",
      },
      {
        name: 'navi',
        href: 'https://navi.kyphan38.com',
        desc: "Grow one step a day: drills, course plan, and roadmap.",
        domain: 'navi.kyphan38.com',
        icon: "<path pathLength=\"1\" d=\"M5 18.5L11.5 14.5L18.5 5.5\"/> <circle cx=\"5\" cy=\"18.5\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/> <circle cx=\"11.5\" cy=\"14.5\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/> <circle cx=\"18.5\" cy=\"5.5\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/>",
      },
    ],
  },
  {
    id: 'tools',
    title: 'Tools',
    apps: [
      {
        name: 'mora',
        href: 'https://mora.kyphan38.com',
        desc: "A quiet focus timer: one task, one clock.",
        domain: 'mora.kyphan38.com',
        icon: "<circle cx=\"12\" cy=\"12\" r=\"8\"/> <path d=\"M12 12V7.9\"/> <path d=\"M12 12h3.3\"/>",
      },
      {
        name: 'moni',
        href: 'https://github.com/kyphan38/moni',
        desc: "Mac health checks, alerts, and a care schedule.",
        domain: 'local · macos',
        icon: "<path pathLength=\"1\" d=\"M2.5 12h4.2l2.1-4.6 3.6 9.2 2.4-6.2 1.5 1.6h5.2\"/>",
      },
      {
        name: 'cskills',
        href: 'https://cskills.kyphan38.com',
        desc: "My Claude Code skills, and how to use each one.",
        domain: 'cskills.kyphan38.com',
        icon: "<path d=\"M5 7.5l4.5 4.5L5 16.5\"/> <line x1=\"12.5\" y1=\"17\" x2=\"19\" y2=\"17\"/>",
      },
    ],
  },
];

export const ALL_APPS: AppItem[] = GROUPS.flatMap((g) => g.apps);
