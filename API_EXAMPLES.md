# API Usage Examples for Conversations in Campaigns

## Step-by-Step Flow

### 1. Create a Campaign (if you don't have one)

```bash
POST http://localhost:3500/campaigns
Content-Type: application/json

{
  "campaign_name": "Summer Sale 2024",
  "status": "active",
  "goals": "Increase sales by 30%",
  "channels": "Social Media, Email, PPC",
  "budget": 50000,
  "start_date": "2024-06-01",
  "end_date": "2024-08-31",
  "audience": "18-45 age group",
  "content": "50% off summer collection",
  "userId": "YOUR_USER_MONGODB_ID"
}
```

Response will contain campaign `_id` - save this!

---

### 2. Create a Conversation Within the Campaign

```bash
POST http://localhost:3500/conversations
Content-Type: application/json

{
  "user_id": "YOUR_USER_MONGODB_ID",
  "campaign_id": "CAMPAIGN_ID_FROM_STEP_1",
  "title": "Social Media Strategy Discussion",
  "context": {
    "business_type": "E-commerce",
    "industry": "Fashion Retail",
    "target_audience": ["18-30", "Professional Women"],
    "marketing_goal": "Drive summer sales",
    "tone": "Casual, trendy, enthusiastic"
  },
  "ai_preferences": {
    "marketing_style": "data-driven",
    "tone": "conversational"
  }
}
```

Response:
```json
{
  "conversation_id": "uuid-123-456",
  "_id": "CONVERSATION_MONGODB_ID",
  "user_id": "USER_ID",
  "campaign_id": "CAMPAIGN_ID",
  "title": "Social Media Strategy Discussion",
  "status": "active",
  "createdAt": "2024-06-01T10:00:00Z"
}
```

---

### 3. Add Messages to the Conversation

#### User Message:
```bash
POST http://localhost:3500/messages
Content-Type: application/json

{
  "conversation": "CONVERSATION_MONGODB_ID",
  "sender": "USER_MONGODB_ID",
  "role": "user",
  "content": "What's the best social media platform for our target audience?",
  "metadata": {}
}
```

#### AI Assistant Response:
```bash
POST http://localhost:3500/messages
Content-Type: application/json

{
  "conversation": "CONVERSATION_MONGODB_ID",
  "role": "assistant",
  "content": "Based on your target audience of professional women aged 18-30, Instagram and Pinterest would be ideal platforms. Instagram offers strong visual storytelling for fashion, while Pinterest drives high-intent shopping behavior...",
  "metadata": {
    "ai_model": "gpt-4",
    "tokens_used": 245,
    "campaign_suggestions": [
      "Instagram Stories with behind-the-scenes content",
      "Pinterest seasonal boards"
    ]
  }
}
```

#### Another User Message:
```bash
POST http://localhost:3500/messages
Content-Type: application/json

{
  "conversation": "CONVERSATION_MONGODB_ID",
  "sender": "USER_MONGODB_ID",
  "role": "user",
  "content": "Should we invest more in Instagram or TikTok?",
  "metadata": {}
}
```

---

### 4. Retrieve Conversation with All Messages

```bash
GET http://localhost:3500/conversations/CONVERSATION_MONGODB_ID
```

Response:
```json
{
  "conversation": {
    "_id": "CONVERSATION_ID",
    "conversation_id": "uuid-123",
    "title": "Social Media Strategy Discussion",
    "status": "active",
    "last_message_at": "2024-06-01T10:15:00Z",
    "message_count": 3,
    "user_id": { "username": "john_doe", "email": "john@example.com" },
    "campaign_id": { "campaign_name": "Summer Sale 2024", "status": "active" }
  },
  "messages": [
    {
      "message_id": "msg-uuid-1",
      "role": "user",
      "content": "What's the best social media platform...",
      "sender": { "username": "john_doe", "email": "john@example.com" },
      "createdAt": "2024-06-01T10:00:00Z"
    },
    {
      "message_id": "msg-uuid-2",
      "role": "assistant",
      "content": "Based on your target audience...",
      "metadata": { "ai_model": "gpt-4", "tokens_used": 245 },
      "createdAt": "2024-06-01T10:01:00Z"
    },
    {
      "message_id": "msg-uuid-3",
      "role": "user",
      "content": "Should we invest more in Instagram or TikTok?",
      "sender": { "username": "john_doe", "email": "john@example.com" },
      "createdAt": "2024-06-01T10:15:00Z"
    }
  ]
}
```

---

### 5. View All Conversations in a Campaign

```bash
GET http://localhost:3500/conversations/campaign/CAMPAIGN_MONGODB_ID
```

Returns array of all conversations for that campaign.

---

### 6. View All Conversations for a User

```bash
GET http://localhost:3500/conversations/user/USER_MONGODB_ID
```

Returns array of all conversations (both campaign-linked and standalone).

---

### 7. Get Campaign with All Its Conversations

```bash
GET http://localhost:3500/campaigns/CAMPAIGN_MONGODB_ID
```

Response now includes:
```json
{
  "_id": "CAMPAIGN_ID",
  "campaign_name": "Summer Sale 2024",
  "conversations": [
    {
      "_id": "CONV_1",
      "title": "Social Media Strategy Discussion",
      "status": "active",
      "last_message_at": "2024-06-01T10:15:00Z"
    },
    {
      "_id": "CONV_2",
      "title": "Budget Allocation Review",
      "status": "active",
      "last_message_at": "2024-06-01T09:30:00Z"
    }
  ]
}
```

---

## Summary of Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/conversations` | POST | Create a new conversation in a campaign |
| `/conversations/:id` | GET | Get conversation with all messages |
| `/conversations/:id` | PUT | Update conversation details |
| `/conversations/:id` | DELETE | Delete conversation and all messages |
| `/conversations/user/:userId` | GET | Get all user's conversations |
| `/conversations/campaign/:campaignId` | GET | Get all conversations in a campaign |
| `/messages` | POST | Add a message to a conversation |
| `/messages/:id` | GET | Get a single message |
| `/messages/:id` | PUT | Update a message |
| `/messages/:id` | DELETE | Delete a message |
| `/messages/conversation/:conversationId` | GET | Get all messages in a conversation |
| `/campaigns/:id` | GET | Get campaign with its conversations |

---

## Frontend Integration Tips

1. **Start Conversation**: Use POST `/conversations` with `campaign_id` when user clicks "Start Discussion" on a campaign
2. **Load Messages**: Use GET `/conversations/:id` to load full conversation history
3. **Send Message**: Use POST `/messages` after user types and hits send
4. **Get Campaign Details**: Use GET `/campaigns/:id` to show campaign with conversation list
5. **Show All Campaigns**: Use GET `/campaigns/user/:userId` to list all campaigns with their conversations

