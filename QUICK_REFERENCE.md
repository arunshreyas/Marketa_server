# Quick API Reference

## Base URL: `http://localhost:3500`

## Campaign Endpoints

### Get Single Campaign (with conversations)
```
GET /campaigns/:id
```
Example: `GET /campaigns/507f1f77bcf86cd799439011`

Returns campaign with populated conversations array.

### Get All User's Campaigns
```
GET /campaigns/user/:userId
```
Example: `GET /campaigns/user/507f1f77bcf86cd799439011`

Returns array of campaigns with conversations.

### Create Campaign
```
POST /campaigns
```

### Update Campaign
```
PUT /campaigns/:id
```

### Delete Campaign (cascades to conversations & messages)
```
DELETE /campaigns/:id
```

---

## Conversation Endpoints (for campaign discussions)

### Create Conversation in Campaign
```
POST /conversations
```
Body: `{ "user_id": "...", "campaign_id": "507f...", "title": "..." }`

### Get Single Conversation with Messages
```
GET /conversations/:id
```

### Get All Conversations in a Campaign
```
GET /conversations/campaign/:campaignId
```

### Get All User's Conversations
```
GET /conversations/user/:userId
```

### Delete Conversation
```
DELETE /conversations/:id
```

---

## Message Endpoints

### Add Message to Conversation
```
POST /messages
```
Body: `{ "conversation": "conv_id", "sender": "user_id", "role": "user", "content": "..." }`

### Get All Messages in Conversation
```
GET /messages/conversation/:conversationId
```

### Get Single Message
```
GET /messages/:id
```

---

## Common Flow

1. **Get Campaign**: `GET /campaigns/:campaignId`
2. **Create Conversation**: `POST /conversations` with `campaign_id`
3. **Add Messages**: `POST /messages` with `conversation` id
4. **View Full Chat**: `GET /conversations/:id`

