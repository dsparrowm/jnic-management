# Mobile pastor chat

Read `AGENTS.md` before starting.

**Track:** post-MVP mobile  
**Depends on:** Auth, org hierarchy, pastor directory

## Scope

Text messaging for pastors: private chats, one zone room per zone, and one state room per state.

**In scope**

- Floating chat button on main tabs with unread badge
- Inbox at `/messages`
- Conversation thread at `/messages/[id]`
- Start private chat from the Pastors directory
- Auto-provisioned zone and state group rooms from org assignment

**Out of scope**

- Attachments, voice notes, read receipts
- Push notifications for new messages
- Web chat UI

## Conversation rules

| Type | Members |
| ---- | ------- |
| **Direct** | Any two active messaging roles (pastors, Admin, Lead Pastor) |
| **Zone** | Zonal pastor + branch pastors in that zone |
| **State** | State pastor + zonal pastors in that state + unzoned branch pastors in that state |

Admin and Lead Pastor are not added to every group room. They can be reached by private message.

Membership syncs when the inbox loads. Reassign and deactivate remove pastors from rooms on the next sync.

## API

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/chat/inbox` | Inbox with last message and unread counts |
| GET | `/chat/unread-count` | Total unread for the floating button |
| POST | `/chat/direct` | Open or create a private chat |
| GET | `/chat/conversations/:id/messages` | Paginated messages |
| POST | `/chat/conversations/:id/messages` | Send a text message |
| PATCH | `/chat/conversations/:id/read` | Mark conversation read |

Search on the pastor directory matches name, email, or phone.

## RBAC

- Messaging roles: `LEAD_PASTOR`, `ADMIN`, `STATE_PASTOR`, `ZONAL_PASTOR`, `BRANCH_PASTOR`
- Only conversation participants can read or send in a thread
- Guards enforce membership; mobile hides the button where chat is unavailable

## Acceptance

- [x] Zone and state pastors see their group rooms in the inbox
- [x] Branch pastors see their zone room, or state room when unzoned
- [x] Private chat opens from the directory message icon
- [x] Unread badge on the floating button
- [x] Text send with live Socket.IO delivery on the conversation screen
