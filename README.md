# Site – Sandbox Operations API

Site-SB Operations API is a lightweight backend service for an SCP:RP game's Serious Roleplay Site. It receives webhook requests, routes them to dedicated processes, and synchronizes server data with a MariaDB database.

> Project made by: **Mirae** (Discord: `@drmirae`)\
> Version: `v0.3.3`

## How to Use

All requests are sent via HTTP `POST` to the `/post` endpoint with a JSON body.

### Request Format

```json
{
  "process": "<process_name>",
  "key": {
    "key1": <current_unix_timestamp>,
    "key2": <calculated_key>
  },
  "data": {
    /* Process-specific parameters */
  }
}
```

#### Authentication (`key`)
Every request must include a `key` object for authentication and replay protection:
- **`key1`** `(number)`: The current Unix timestamp in seconds. Must be within `-15` to `+5` seconds of the server's current timestamp.
- **`key2`** `(number)`: Calculated key matching `key1 * KEY_MULTIPLIER` (shared secret integer configured on the server).

---

## Available Processes

### 1. `log_session`
Records an individual player's gameplay session into the `sessions` table and updates / inserts their accumulated playtime in the `users` table.

#### Parameters (`data`)
| Field             | Type     | Required | Description                                                                                        |
|-------------------|----------|----------|----------------------------------------------------------------------------------------------------|
| `roblox_id`       | `string` | Yes      | The Roblox user ID of the player.                                                                  |
| `username`        | `string` | Yes      | The Roblox username of the player.                                                                 |
| `start_timestamp` | `number` | Yes      | Unix timestamp (in seconds) when the player started the session.                                   |
| `end_timestamp`   | `number` | Yes      | Unix timestamp (in seconds) when the player ended the session (`end_timestamp > start_timestamp`). |

#### Example Request
```json
{
  "process": "log_session",
  "key": {
    "key1": 1716984000,
    "key2": 8584920000
  },
  "data": {
    "roblox_id": "123456789",
    "username": "PlayerName",
    "start_timestamp": 1716980400,
    "end_timestamp": 1716984000
  }
}
```

#### Example Response
```json
{
  "code": 200,
  "message": {
    "roblox_id": "123456789",
    "playtime": 3600
  }
}
```

---

### 2. `get_playtime`
Retrieves the total accumulated playtime (in seconds) for a player from the `users` table.

#### Parameters (`data`)
| Field       | Type     | Required  | Description                        |
|-------------|----------|-----------|------------------------------------|
| `roblox_id` | `string` | Optional* | The Roblox user ID of the player.  |
| `username`  | `string` | Optional* | The Roblox username of the player. |

*\* At least one of `roblox_id` or `username` must be provided. If both are provided, `roblox_id` is prioritized.*

#### Example Request (by Roblox ID)
```json
{
  "process": "get_playtime",
  "key": {
    "key1": 1716984000,
    "key2": 8584920000
  },
  "data": {
    "roblox_id": "123456789"
  }
}
```

#### Example Request (by Username)
```json
{
  "process": "get_playtime",
  "key": {
    "key1": 1716984000,
    "key2": 8584920000
  },
  "data": {
    "username": "PlayerName"
  }
}
```

#### Example Response
```json
{
  "code": 200,
  "message": {
    "roblox_id": "123456789",
    "playtime": 7200
  }
}
```

---

### 3. `get_all_sessions`
Retrieves all the sessions of a player from the `sessions` table.

#### Parameters (`data`)
| Field       | Type     | Required  | Description                        |
|-------------|----------|-----------|------------------------------------|
| `roblox_id` | `string` | Optional* | The Roblox user ID of the player.  |
| `username`  | `string` | Optional* | The Roblox username of the player. |

*\* At least one of `roblox_id` or `username` must be provided. If both are provided, `roblox_id` is prioritized.*

#### Example Request (by Roblox ID)
```json
{
  "process": "get_all_sessions",
  "key": {
    "key1": 1716984000,
    "key2": 8584920000
  },
  "data": {
    "roblox_id": "123456789"
  }
}
```

#### Example Request (by Username)
```json
{
  "process": "get_all_sessions",
  "key": {
    "key1": 1716984000,
    "key2": 8584920000
  },
  "data": {
    "username": "PlayerName"
  }
}
```

#### Example Response
```json
{
  "code": 200,
  "message": {
    "roblox_id": "123456789",
    "sessions": [
      {
        "id": 1,
        "start_timestamp": 1716980400,
        "end_timestamp": 1716984000
      }
    ]
  }
}
```

---

## Response & Status Codes

All API responses follow a consistent wrapper format:

```json
{
  "code": <http_status_code>,
  "message": <response_object_or_error>
}
```

| Status Code | Reason                | Description                                                                    |
|-------------|-----------------------|--------------------------------------------------------------------------------|
| `200`       | OK                    | Request processed successfully.                                                |
| `400`       | Bad Request           | Missing required fields, invalid JSON structure, or invalid timestamp values.  |
| `401`       | Unauthorized          | Key verification failed (invalid multiplier or expired/out-of-sync timestamp). |
| `404`       | Not Found             | Unknown process requested or player not found in the database.                 |
| `500`       | Internal Server Error | Unhandled server or database error.                                            |

---

## Configuration

Environment variables are loaded from `config/.env`:

| Variable         | Description                                                   | Default |
|------------------|---------------------------------------------------------------|---------|
| `SERVER_PORT`    | Port the Express server listens on                            | `3413`  |
| `KEY_MULTIPLIER` | Secret multiplier integer used for timestamp key verification | `1`     |
| `DB_HOST`        | MariaDB server host address                                   | -       |
| `DB_USER`        | MariaDB username                                              | -       |
| `DB_PASSWORD`    | MariaDB password                                              | -       |
| `DB_NAME`        | MariaDB database name                                         | -       |