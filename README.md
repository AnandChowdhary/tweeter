# 🐦 Tweeter

An automated Twitter content generation and scheduling system that creates engaging threads from blog posts and news articles built on top of GitHub Actions.

## ⚙️ Setup

### Prerequisites

- Node.js (v18 or higher)
- OpenAI API key
- Typefully API key

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd tweeter
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
export OPENAI_API_KEY="your-openai-api-key"
export TYPEFULLY_API_KEY="your-typefully-api-key"
```

### Configuration

The application uses a `state.json` file to track:

- Previously processed news articles
- Last blog post processed
- Execution timestamps

## 🚀 Usage

### Manual execution

Run the daily news task:

```bash
npx tsx tasks/daily.ts
```

Run the biweekly blog post task:

```bash
npx tsx tasks/biweekly.ts
```

### Automated scheduling

Set up cron jobs for automated execution:

```bash
# Daily news thread generation (every day at 9 AM)
0 9 * * * cd /path/to/tweeter && npx tsx tasks/daily.ts

# Biweekly blog post thread generation (every 2 weeks)
0 10 */14 * * cd /path/to/tweeter && npx tsx tasks/biweekly.ts
```

## 🔄 Content generation process

### 1. Content discovery

- **Daily**: Fetches latest AI news from smol.ai RSS feed
- **Biweekly**: Retrieves blog posts from personal blog API

### 2. Duplicate detection

- Checks against previously processed content
- Skips if content has already been tweeted

### 3. Idea generation

- Uses AI to generate tweet topics from content
- Creates multiple thread ideas for variety

### 4. Thread creation

- Generates initial thread using specialized agents
- Applies voice transformation for consistency
- Parses tweets into proper format

### 5. Scheduling

- Creates drafts in Typefully
- Schedules for next available time slot
- Enables thread formatting

## 🤖 Agents

### Blog thread generator

- Transforms blog posts into Twitter threads
- Maintains technical accuracy and nuance
- Includes web search capabilities for context

### News thread generator

- Creates threads from tech news articles
- Focuses on technical insights and implications
- Provides thoughtful analysis

### Voice generator

- Rewrites content in consistent authorial voice
- Maintains intellectual honesty and nuance
- Ensures technical audience appropriateness
- Based on [this ChatGPT deep research](https://chatgpt.com/share/689344ce-3684-8013-9d7d-cb71b2c4acbe)

### Ideas generator

- Extracts tweet topics from content
- Generates multiple thread ideas
- Ensures content variety

## 💾 State management

The application maintains state in `state.json`:

```json
{
  "previousSmolAiNewsThread": "last-processed-news-url",
  "previousBlogPostThread": "last-processed-blog-post-path",
  "lastDailyRunAt": "timestamp",
  "lastBiWeeklyRunAt": "timestamp"
}
```

## 📄 License

MIT (c) 2025 [Anand Chowdhary](https://anandchowdhary.com)
