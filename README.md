# 🐦 Tweeter

An automated Twitter content generation system that creates suggested tweet threads from various sources built for @AnandChowdhary's profile. The system generates content drafts in Typefully for manual review and approval before posting.

## ⚙️ Setup

### Prerequisites

- Node.js (v18 or higher)
- OpenAI API key
- Typefully API key

### Installation

```bash
git clone <repository-url>
cd tweeter
npm install
```

### Environment variables

```bash
export OPENAI_API_KEY="your-openai-api-key"
export TYPEFULLY_API_KEY="your-typefully-api-key"
```

## 🚀 Usage

### Manual execution

For example, running the starred repositories workflow from the CLI:

```bash
npx tsx tasks/starred-repos.ts
```

### Automated scheduling

The system includes GitHub Actions workflows that run automatically:

- Daily: AI news, tech news, and starred repos
- Weekly: Changelog posts
- Biweekly: Blog posts
- Triweekly: Personal notes
- Alternate weekly: Open source projects

## 📋 Content sources

| Task                               | Source             | Description                          |
| ---------------------------------- | ------------------ | ------------------------------------ |
| `notes.ts`                         | Personal notes API | Personal notes and thoughts          |
| `blog-posts.ts`                    | Personal blog API  | Personal blog posts and articles     |
| `quotes.ts`                        | Personal API       | Quotes from Limitless life logs      |
| `link.ts`                          | Any URL            | Generate from any article link       |
| `note.ts`                          | Manual input       | Generate from personal note text     |
| `changelog.ts`                     | FirstQuadrant API  | Company changelog and updates        |
| `featured-open-source-projects.ts` | GitHub API         | Curated open source projects         |
| `starred-repos.ts`                 | GitHub API         | Recently starred repositories        |
| `ai-news.ts`                       | smol.ai RSS feed   | Latest AI news and announcements     |
| `tech-news.ts`                     | Reddit r/technews  | Tech news with community discussions |

## 🤖 AI agents

The system uses specialized AI agents for different content types:

- Content generators: Transform source material into Twitter threads
- Voice generator: Rewrites content in consistent authorial voice
- Ideas generator: Extracts tweet topics and creates thread ideas
- Technical scorer: Evaluates technical complexity (1-10 scale)
- Thread converter: Converts multi-tweet threads to single tweets

## 🔄 Workflow

1. Content discovery: Fetches latest content from configured sources
2. Duplicate detection: Skips previously processed content
3. AI processing: Generates thread ideas and creates initial drafts
4. Voice transformation: Applies consistent authorial voice
5. Draft creation: Creates drafts in Typefully for review
6. Manual approval: You edit and approve before posting

## 📱 Apple Shortcuts

Set up a custom shortcut to generate threads from any article:

1. Create shortcut in Apple Shortcuts app
2. Add "Get Contents of URL" action with GitHub Actions workflow URL
3. Add to iPhone share sheet for one-tap thread generation

## 💾 State management

The system tracks processed content in `state.json` to avoid duplicates and maintain execution history.

### Recent tweets tracking

The system stores recent tweet topics (ideas) in `state.json` to prevent repetition:

- **AI news**: When generating tweet ideas, recent topics are passed as context to help the AI avoid similar themes
- **Tech news**: Recent topics are provided to avoid repeating similar news stories
- **Storage**: Up to 50 most recent tweet topics are kept in the `recentTweets` array
- **Format**: Topics are stored as concise titles/descriptions (not full tweets)

This ensures that the content generation system produces fresh, diverse content and doesn't repeat the same ideas or news angles.

## 📄 License

MIT (c) 2025 [Anand Chowdhary](https://anandchowdhary.com)
