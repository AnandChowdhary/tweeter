# 🐦 Tweeter

An automated Twitter content generation and scheduling system that creates suggested tweet threads from blog posts and news articles. The system generates content drafts that you manually review, edit, and approve before posting to Twitter.

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

## 🔄 GitHub Actions Workflows

This repository includes several GitHub Actions workflows that automate content generation:

### Scheduled Workflows

- **Daily** (`daily.yml`): Runs every day at 10 AM UTC to generate news threads and process starred repositories
- **Weekly** (`weekly.yml`): Runs every Thursday at 9 AM UTC to generate changelog threads
- **Biweekly** (`biweekly.yml`): Runs every 2 weeks to generate blog post threads
- **Triweekly** (`triweekly.yml`): Runs every 3 weeks to generate note-based threads
- **Alternate Weekly** (`alternate-weekly.yml`): Runs on alternate weeks to generate open source project threads

### Manual Workflows

- **Link** (`link.yml`): Manually trigger to generate threads from any article URL
  - Input: Article link (required), optional comment for context
  - Perfect for sharing interesting articles you discover
- **Note** (`note.yml`): Manually trigger to generate threads from personal notes
  - Input: Note content (required)
  - Great for turning quick thoughts into tweet threads

### Workflow Features

All workflows:

- Run on Ubuntu latest with Node.js LTS
- Install dependencies automatically
- Use your configured API keys from GitHub Secrets
- Commit state changes back to the repository
- Can be triggered manually via `workflow_dispatch` or automatically via cron schedules

### Setting up GitHub Secrets

To use the workflows, add these secrets to your repository:

1. Go to your repository Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `TYPEFULLY_API_KEY`: Your Typefully API key

### Manual Workflow Triggers

You can manually trigger workflows from the GitHub Actions tab:

1. Go to Actions tab in your repository
2. Select the workflow you want to run
3. Click "Run workflow"
4. Fill in required inputs (for Link and Note workflows)
5. Click "Run workflow"

This is especially useful for the Link workflow when you want to quickly generate threads from articles you find interesting.

## 🔄 Content generation process

### 1. Content discovery

- **Daily**: Fetches latest AI news from smol.ai RSS feed
- **Biweekly**: Retrieves blog posts from personal blog API
- **Triweekly** Retrieves notes from personal API
- **Weekly** - Find FirstQuadrant's latest changelog post
- **Alternate weekly** - Retrieves an old open source project

### 2. Duplicate detection

- Checks against previously processed content
- Skips if content has already been suggested

### 3. Idea generation

- Uses AI to generate tweet topics from content
- Creates multiple thread ideas for variety

### 4. Thread creation

- Generates initial thread using specialized agents
- Applies voice transformation for consistency
- Parses tweets into proper format

### 5. Draft creation & review

- Creates drafts in Typefully for your review
- Requires manual editing and approval before posting
- Enables thread formatting
- You maintain full control over what gets published

## 📝 Life logs integration

The system integrates with my **Life Logs repository** where I store transcriptions from all my conversations using a Limitless pendant. This feature allows you to:

- Extract valuable insights and lessons from founder conversations
- Generate tweet ideas based on real founder experiences and challenges
- Transform casual conversations into meaningful content for your audience
- Maintain a searchable archive of founder wisdom and insights

The Life Logs feature automatically processes these transcripts to identify tweet-worthy content, helping you share authentic founder lessons and reflections with your Twitter audience.

## 🤖 Agents

### Blog thread generator

- Transforms blog posts into Twitter threads
- Maintains technical accuracy and nuance
- Includes web search capabilities for context

### News thread generator

- Creates threads from tech news articles
- Focuses on technical insights and implications
- Provides thoughtful analysis

### Link thread generator

- Generates tweet threads from any article URL
- Performs deep technical analysis of the content
- Conducts supplementary research when needed
- Creates intellectually engaging threads for technical audiences
- Maintains critical perspective and technical depth

### Voice generator

- Rewrites content in consistent authorial voice
- Maintains intellectual honesty and nuance
- Ensures technical audience appropriateness
- Based on [this ChatGPT deep research](https://chatgpt.com/share/689344ce-3684-8013-9d7d-cb71b2c4acbe)

### Ideas generator

- Extracts tweet topics from content
- Generates multiple thread ideas
- Ensures content variety

## Link-based tweet generation

The system can automatically generate suggested tweet threads from any article link you provide. This feature is perfect for quickly creating content drafts for interesting articles you come across.

#### Apple Shortcuts integration

For seamless article sharing, you can set up a custom shortcut in the Apple Shortcuts app:

1. **Create a new shortcut** in the Shortcuts app
2. **Add a "Get Contents of URL" action** with the GitHub Actions workflow URL
3. **Add a "Get Text from Input" action** to extract the article URL
4. **Add a "URL" action** to construct the final workflow URL with the article link
5. **Add a "Get Contents of URL" action** to trigger the workflow
6. **Save the shortcut** and add it to your iPhone's share sheet

Now whenever you find an interesting article:

- Tap the share button
- Select your custom shortcut
- The system will automatically generate **suggested tweet threads** for your review
- You can edit and approve the content before scheduling

The shortcut essentially automates the process of sending article URLs to your GitHub Actions workflow, making it effortless to create content drafts for interesting articles. You need the actions:write permission in your fine-grain access token to trigger workflows.

## 💾 State management

The application maintains state in `state.json`:

```json
{
  "previousSmolAiNewsThread": "last-processed-news-url",
  "previousBlogPostThread": "last-processed-blog-post-path",
  "previousChangelogPostThread": "last-processed-changelog-post-path",
  "lastDailyRunAt": "timestamp",
  "lastBiWeeklyRunAt": "timestamp"
}
```

## 📄 License

MIT (c) 2025 [Anand Chowdhary](https://anandchowdhary.com)
