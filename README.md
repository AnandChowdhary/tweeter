# 🐦 Tweeter

An automated Twitter content generation system that creates suggested tweet threads from various sources. The system generates content drafts in Typefully for manual review and approval before posting.

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

```bash
# AI news from smol.ai RSS feed
npx tsx tasks/ai-news.ts

# Tech news from Reddit r/technews
npx tsx tasks/tech-news.ts

# Blog posts from personal API
npx tsx tasks/blog-posts.ts

# Changelog posts from FirstQuadrant
npx tsx tasks/changelog.ts

# Personal notes from API
npx tsx tasks/notes.ts

# Featured open source projects
npx tsx tasks/featured-open-source-projects.ts

# Starred repositories
npx tsx tasks/starred-repos.ts

# Quotes and wisdom
npx tsx tasks/quotes.ts

# Generate from any article URL
npx tsx tasks/link.ts

# Generate from personal note
npx tsx tasks/note.ts
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
| `ai-news.ts`                       | smol.ai RSS feed   | Latest AI news and announcements     |
| `tech-news.ts`                     | Reddit r/technews  | Tech news with community discussions |
| `blog-posts.ts`                    | Personal blog API  | Personal blog posts and articles     |
| `changelog.ts`                     | FirstQuadrant API  | Company changelog and updates        |
| `notes.ts`                         | Personal notes API | Personal notes and thoughts          |
| `featured-open-source-projects.ts` | GitHub API         | Curated open source projects         |
| `starred-repos.ts`                 | GitHub API         | Recently starred repositories        |
| `quotes.ts`                        | Personal API       | Wisdom and quotes collection         |
| `link.ts`                          | Any URL            | Generate from any article link       |
| `note.ts`                          | Manual input       | Generate from personal note text     |

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

## 📱 Apple shortcuts integration

Set up a custom shortcut to generate threads from any article:

1. Create shortcut in Apple Shortcuts app
2. Add "Get Contents of URL" action with GitHub Actions workflow URL
3. Add to iPhone share sheet for one-tap thread generation

## 💾 State management

The system tracks processed content in `state.json` to avoid duplicates and maintain execution history.

## 📄 License

MIT (c) 2025 [Anand Chowdhary](https://anandchowdhary.com)
