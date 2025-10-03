# AI Agents System Documentation

## Overview

The Social AI Manager now includes a comprehensive AI Agents system that automates social media activities including auto-posting, engagement, and following. This system uses OpenAI's GPT models to intelligently analyze content and make decisions about social media interactions.

## Architecture

### Core Components

1. **AIAgent Base Class** - Abstract base class for all AI agents
2. **AutoPostingAgent** - Handles automated content posting
3. **EngagementAgent** - Manages likes, comments, and interactions
4. **FollowingAgent** - Automates account following based on keywords
5. **AgentManager** - Centralized management of all agents

### Key Features

- **Intelligent Content Analysis** - Uses AI to analyze content sentiment, engagement potential, and relevance
- **Scheduled Operations** - Cron-based scheduling for automated activities
- **Rate Limiting** - Built-in cooldown periods and daily limits
- **Platform Integration** - Works with Facebook, Instagram, TikTok, and YouTube APIs
- **Real-time Monitoring** - Live status updates and analytics

## AI Agents

### 1. Auto-Posting Agent

**Purpose**: Automatically posts content to social media platforms at optimal times.

**Features**:
- Content queue management
- Platform-specific content generation
- Optimal posting time analysis
- Multi-platform posting

**Configuration**:
```javascript
{
  schedule: '0 9,15,21 * * *', // 9 AM, 3 PM, 9 PM
  maxActionsPerDay: 3,
  cooldownMinutes: 60
}
```

**API Endpoints**:
- `POST /api/agents/auto-posting/add-content` - Add content to queue
- `GET /api/agents/auto-posting/queue` - Get queue status

### 2. Engagement Agent

**Purpose**: Automatically likes and comments on relevant posts to increase engagement.

**Features**:
- Target account management
- Content sentiment analysis
- Intelligent response generation
- Engagement scoring

**Configuration**:
```javascript
{
  schedule: '*/30 * * * *', // Every 30 minutes
  maxActionsPerDay: 50,
  cooldownMinutes: 5
}
```

**API Endpoints**:
- `POST /api/agents/engagement/add-target` - Add engagement target
- `GET /api/agents/engagement/targets` - Get targets list
- `POST /api/agents/engagement/run` - Run engagement manually

### 3. Following Agent

**Purpose**: Automatically follows accounts based on keyword searches and criteria.

**Features**:
- Keyword-based account discovery
- Account quality analysis
- Following criteria filtering
- Follow history tracking

**Configuration**:
```javascript
{
  schedule: '0 10,14,18 * * *', // 10 AM, 2 PM, 6 PM
  maxActionsPerDay: 20,
  cooldownMinutes: 15
}
```

**API Endpoints**:
- `POST /api/agents/following/add-keywords` - Add following keywords
- `GET /api/agents/following/keywords` - Get keywords list
- `POST /api/agents/following/run` - Run following manually

## API Reference

### Agent Management

#### Get All Agent Status
```http
GET /api/agents/status
```

Response:
```json
{
  "success": true,
  "agents": [
    {
      "name": "autoPosting",
      "enabled": true,
      "isRunning": false,
      "lastActionTime": "2024-01-01T10:00:00Z",
      "actionCount": 2,
      "maxActionsPerDay": 3,
      "schedule": "0 9,15,21 * * *",
      "cooldownMinutes": 60
    }
  ]
}
```

#### Start/Stop Agent
```http
POST /api/agents/start/{agentName}
POST /api/agents/stop/{agentName}
```

#### Update Agent Configuration
```http
PUT /api/agents/config/{agentName}
Content-Type: application/json

{
  "schedule": "0 9 * * *",
  "maxActionsPerDay": 5,
  "cooldownMinutes": 30
}
```

#### Get Agent Analytics
```http
GET /api/agents/analytics
```

Response:
```json
{
  "success": true,
  "analytics": {
    "autoPosting": {
      "queueSize": 5,
      "postsToday": 2,
      "totalPosts": 15
    },
    "engagement": {
      "targetsCount": 10,
      "engagementsToday": 25,
      "totalEngagements": 150
    },
    "following": {
      "keywordsCount": 5,
      "followsToday": 8,
      "totalFollows": 45,
      "followingListSize": 200
    }
  }
}
```

## AI Content Analysis

### Content Analysis Process

1. **Sentiment Analysis** - Determines if content is positive, negative, or neutral
2. **Engagement Scoring** - Rates content's potential for engagement (0-1)
3. **Relevance Assessment** - Evaluates content relevance to target audience (0-1)
4. **Keyword Extraction** - Identifies key topics and themes
5. **Action Recommendation** - Suggests appropriate actions (like, comment, share, follow)

### Example Analysis Output

```json
{
  "sentiment": "positive",
  "engagement": 0.8,
  "relevance": 0.7,
  "keywords": ["technology", "innovation", "AI"],
  "action_recommendation": "comment"
}
```

## Best Practices

### 1. Rate Limiting
- Always respect platform rate limits
- Use built-in cooldown periods
- Monitor daily action counts
- Implement exponential backoff for errors

### 2. Content Quality
- Set appropriate engagement thresholds
- Use relevant keywords for following
- Monitor agent performance regularly
- Adjust criteria based on results

### 3. Platform Compliance
- Follow platform terms of service
- Use authentic engagement patterns
- Avoid spam-like behavior
- Respect user privacy

### 4. Monitoring
- Check agent status regularly
- Monitor analytics for trends
- Review engagement quality
- Adjust strategies based on performance

## Security Considerations

### 1. API Keys
- Store API keys securely in environment variables
- Rotate keys regularly
- Use different keys for different environments
- Monitor API usage

### 2. Rate Limiting
- Implement proper rate limiting
- Monitor for suspicious activity
- Use IP rotation if necessary
- Implement circuit breakers

### 3. Data Privacy
- Don't store sensitive user data
- Use minimal data collection
- Implement data retention policies
- Follow GDPR/privacy regulations

## Troubleshooting

### Common Issues

1. **Agent Not Starting**
   - Check if OpenAI API key is configured
   - Verify cron schedule format
   - Check for conflicting processes

2. **Low Engagement Quality**
   - Adjust engagement thresholds
   - Review target account criteria
   - Check content analysis accuracy

3. **Platform API Errors**
   - Verify API credentials
   - Check rate limits
   - Review platform-specific requirements

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
DEBUG=agents:*
```

## Future Enhancements

### Planned Features
1. **Machine Learning Optimization** - Learn from engagement patterns
2. **Advanced Analytics** - Detailed performance metrics
3. **A/B Testing** - Test different strategies
4. **Multi-Account Management** - Manage multiple social accounts
5. **Content Scheduling** - Advanced scheduling algorithms
6. **Competitor Analysis** - Monitor competitor activities
7. **Influencer Discovery** - Find relevant influencers
8. **Crisis Management** - Handle negative sentiment

### Integration Opportunities
1. **CRM Integration** - Connect with customer databases
2. **Analytics Platforms** - Integrate with Google Analytics, etc.
3. **Content Management** - Connect with CMS systems
4. **E-commerce** - Integrate with online stores
5. **Email Marketing** - Connect with email platforms

## Support

For technical support or feature requests, please:
1. Check the troubleshooting section
2. Review the API documentation
3. Check GitHub issues
4. Contact the development team

---

**Note**: This AI Agents system is designed to enhance social media management while maintaining authenticity and compliance with platform policies. Always use responsibly and in accordance with platform terms of service.
