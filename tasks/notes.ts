import { run } from "@openai/agents";
import { notesThreadGenerator, voiceGenerator } from "../functions/agents";
import { createDraft } from "../functions/schedule-tweets";
import { saveState, state } from "../functions/state";

(async () => {
  const notesPostsUnsorted = (await fetch(
    "https://anandchowdhary.github.io/notes/api.json"
  ).then((res) => res.json())) as {
    slug: "recreate-goofy-for.md";
    path: "notes/2016/recreate-goofy-for.md";
    source: "https://github.com/AnandChowdhary/notes/blob/main/notes/2016/recreate-goofy-for.md";
    title: "Recreate Goofy for Messenger in Swift....";
    date: "2016-11-29T09:32:53.000Z";
    excerpt: "Recreate Goofy for Messenger in Swift. http://github.com/danielbuechele/goofy Thousands of applications, even Oswald-specific by injecting JS, Skype, Whatsapp, everything.";
    attributes: {};
  }[];
  const notesPosts = notesPostsUnsorted.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const previousIndex =
    state.previousNotesPostThread !== undefined &&
    state.previousNotesPostThread !== "none"
      ? notesPosts.findIndex(
          (post) => post.path === state.previousNotesPostThread
        )
      : -1;
  const nextIndex = previousIndex + 1;
  const nextnotesPost = notesPosts[nextIndex];
  if (!nextnotesPost) {
    console.log(
      "No more notes posts, changing state to go back to the beginning"
    );
    saveState({
      previousNotesPostThread: "none",
      lastTriWeeklyRunAt: new Date().toISOString(),
    });
    return;
  }

  const notesPostUrl = nextnotesPost.source;
  const rawnotesPostUrl =
    "https://raw.githubusercontent.com/AnandChowdhary/notes/refs/heads/main/" +
    nextnotesPost.path;
  console.log("Generating thread for", nextnotesPost.title);
  const notesPost =
    `Link: ${notesPostUrl}\nDate: ${nextnotesPost.date}\nTitle: ${nextnotesPost.title}\n\n` +
    (await fetch(rawnotesPostUrl).then((res) => res.text()));
  console.log("Fetched notes post", notesPost);

  const initialResult = await run(notesThreadGenerator, notesPost);
  if (!initialResult.finalOutput)
    throw new Error("No output from notesThreadGenerator");
  console.log("Initial result", initialResult.finalOutput.length);

  const voiceResult = await run(
    voiceGenerator,
    `Please rewrite the following based on the notes post in 100-200 words.\n\n<note>\n${notesPost}\n</note>\n\n${initialResult.finalOutput}\n\nThe first paragraph should end with two emoji, one relevant to the thread + 👇 so people can click to read the rest of the thread. The last tweet should end with "Here's the original note from [year]: [link to markdown file]"`
  );

  if (!voiceResult.finalOutput)
    throw new Error("No output from voiceGenerator");
  console.log("Voice result", voiceResult.finalOutput.length);

  const draft = await createDraft({ content: voiceResult.finalOutput });
  console.log("Scheduled tweet", draft.id);

  saveState({
    previousNotesPostThread: nextnotesPost.path,
    lastTriWeeklyRunAt: new Date().toISOString(),
  });
})()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
