# Fitness app - assignment

### Requirements

- node.js ^12.14.0
- postgres ^11.5
- favourite IDE
- git

### How to start

- fork or download this repository
- install dependencies with `npm i`
- create fitness_app database (application access `postgresql://localhost:5432/fitness_app`, make sure you use correct port and db name )
- create db schema and populate db with `npm run seed`
- run express server with `npm start`

### How submit assignment

- create public bitbucket or github repository
- commit and push changes continuously
- use proper commit messages
- share your solution with us (link or read permissions for miroslava.filcakova@goodrequest.com)


### You can

- change project structure
- change or add any npm module
- change db model (add tables, table columns...)
- change anything if you can say why

***

## Scenario

The goal of this assignement is to modify given REST API written in express.js using typescript. Public API consist of 2 endpoints `[get]` `localhost:8000/exercises` (list of exercises) and `[get]` `localhost:8000/programs` programs (list of programs).

Structure of API responses

```javascript
{
    data: {
        id: 1
    }
    message: 'You have successfully created program'
}
```

or

```javascript
{
    data: [{
        id: 1,
        name: 'Program 1'
    }]
    message: 'List of programs'
}
```

***

## Task 1

Create authorization layer to enable users to access private API (next Task)

- create new db model User(name:string , surname: string, nickName:string, email: string, age: number, role:[ADMIN/USER])
- add authorization layer
- user can register using email, password and role (for purpose of this assignment, user can choose his role in registration)
- user can log in with email and password
- use proper way how to store user data
- you can use any authorization approach or npm module (preferred is JWT strategy and passport)

***

## Task 2

Create private API for user with role [ADMIN]

ADMIN can:

- create, update or delete exercises
- edit exercises in program (add or remove)
- get all users and all its data
- get user detail
- update any user (name, surname, nickName, age, nickName, role)

## Task 3

***

Create private API for user with role [USER]

USER can:

- get all users (id, nickName)
- get own profile data (name, surname, age, nickName)
- track exercises he has completed (he can track same exercise multiple times, we want to save datetime of completion and duration in seconds)
- see list of completed exercises (with datetime and duration) in profile
- remove tracked exercise from completed exercises list

USER cannot:

- access ADMIN API
- get or update another user profile

***

## Bonus task 1 - pagination, filter, search

Add pagination to exercise list using query => `/exercises?page=1&limit=10` return 1 page of exercises in maximal length of 10.

Add filter by program => `/exercises?programID=1` return only exercises of program with id = 1

add fultext search on exercise name => `/exercises?search=cis` => return only exercises which name consist of string `cis`
***

## Bonus task 2 - validation

Create validation service to check request body, query and params to make sure user sends valid request. For example, in registration, user must send valid email, otherwise return status code 400.
Also you can use validation on query in bonus task 1.

***

## Bonus task 3 - localization

Create localization service to send message attribute in API responses in correct language. Default language is EN, optional is SK. User can send all requests with HTTP header `language: 'sk'` or `language: 'en'` to receive required language localization.

example of response for request with `language: 'sk'`

```javascript
{
    data: {
        id: 1
    }
    message: 'Program bol úspešne vytvorený'
}
```

***

## Bonus task 4 - error handling

Create proper way how to handle all errors in application. Use console.error display error in terminal, user can never see stack trace or real error message. You can write error logs to file.

response status code >= 500

```javascript
{
    data: {}
    message: 'Something went wrong'
}
```

***

## API Documentation

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Language Support

Set the `Accept-Language` header to receive localized responses:
- `Accept-Language: en` (English - default)
- `Accept-Language: sk` (Slovak)

### Error Response Format

```json
{
  "message": "Localized error message",
  "type": "ERROR",
  "error": "Optional error details"
}
```

---

## Authentication Endpoints

### POST /auth/register
**Description**: Register a new user account

**Request Body**:
```json
{
  "name": "John",
  "surname": "Doe", 
  "nickName": "johndoe",
  "email": "john@example.com",
  "age": 25,
  "password": "SecurePass123!",
  "role": "USER"
}
```

**Response** (201):
```json
{
  "user": {
    "id": 1,
    "name": "John",
    "surname": "Doe",
    "nickName": "johndoe",
    "email": "john@example.com",
    "age": 25,
    "role": "USER"
  },
  "token": "jwt-token-here"
}
```

**Validation Rules**:
- Email must be valid format
- Password: min 8 chars, uppercase, number, special character
- Age: 1-120 (optional)
- Role: "ADMIN" or "USER"

---

### POST /auth/login
**Description**: Login with email and password

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200):
```json
{
  "user": {
    "id": 1,
    "name": "John",
    "surname": "Doe",
    "nickName": "johndoe",
    "email": "john@example.com",
    "age": 25,
    "role": "USER"
  },
  "token": "jwt-token-here"
}
```

---

## Public Endpoints

### GET /exercises
**Description**: Get all exercises with optional filtering, search, and pagination

**Query Parameters**:
- `programID` (optional): Filter exercises by program ID
- `search` (optional): Search exercises by name (case-insensitive)
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page (max 50)

**Examples**:
```
GET /exercises
GET /exercises?programID=1
GET /exercises?search=push
GET /exercises?page=1&limit=10
GET /exercises?programID=1&search=push&page=1&limit=5
```

**Response** (200):
```json
{
  "exercises": [
    {
      "id": 1,
      "name": "Push-ups",
      "difficulty": "MEDIUM",
      "programs": [
        {
          "id": 1,
          "name": "Strength Training"
        }
      ]
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "hasNextPage": true
  }
}
```

---

### GET /programs
**Description**: Get all programs with their exercises

**Response** (200):
```json
[
  {
    "id": 1,
    "name": "Strength Training",
    "exercises": [
      {
        "id": 1,
        "name": "Push-ups",
        "difficulty": "MEDIUM"
      }
    ]
  }
]
```

---

## Admin-Only Endpoints

### POST /exercises
**Description**: Create a new exercise (ADMIN only)

**Request Body**:
```json
{
  "name": "Squats",
  "difficulty": "HARD"
}
```

**Response** (201):
```json
{
  "id": 2,
  "name": "Squats",
  "difficulty": "HARD"
}
```

---

### PATCH /exercises/:id
**Description**: Update an existing exercise (ADMIN only)

**Request Body**:
```json
{
  "name": "Modified Squats",
  "difficulty": "MEDIUM"
}
```

**Response** (200):
```json
{
  "id": 2,
  "name": "Modified Squats",
  "difficulty": "MEDIUM"
}
```

---

### DELETE /exercises/:id
**Description**: Delete an exercise (ADMIN only)

**Response** (200):
```json
{
  "message": "Exercise deleted successfully",
  "type": "SUCCESS"
}
```

---

### POST /exercises/assign-to-program
**Description**: Add an exercise to a program (ADMIN only)

**Request Body**:
```json
{
  "exerciseID": 1,
  "programID": 2
}
```

**Response** (200):
```json
{
  "message": "Exercise added to program successfully",
  "type": "SUCCESS"
}
```

---

### POST /exercises/remove-from-program
**Description**: Remove an exercise from a program (ADMIN only)

**Query Parameters**:
- `exerciseID`: ID of the exercise
- `programID`: ID of the program

**Example**:
```
POST /exercises/remove-from-program?exerciseID=1&programID=2
```

**Response** (200):
```json
{
  "message": "Exercise removed from program successfully",
  "type": "SUCCESS"
}
```

**Note**: Cannot remove if exercise has completed exercises.

---

### GET /users
**Description**: Get all users (ADMIN sees all data, USER sees only id and nickName)

**Response** (200) - ADMIN:
```json
[
  {
    "id": 1,
    "name": "John",
    "surname": "Doe",
    "nickName": "johndoe",
    "email": "john@example.com",
    "age": 25,
    "role": "USER",
    "completedExercises": [
      {
        "id": 1,
        "completedAt": "2024-01-15T10:30:00.000Z",
        "duration": 300,
        "exercise": {
          "id": 1,
          "name": "Push-ups",
          "difficulty": "MEDIUM"
        },
        "program": {
          "id": 1,
          "name": "Strength Training"
        }
      }
    ]
  }
]
```

**Response** (200) - USER:
```json
[
  {
    "id": 1,
    "nickName": "johndoe"
  }
]
```

---

### GET /users/:id
**Description**: Get detailed user information (ADMIN only)

**Response** (200):
```json
{
  "id": 1,
  "name": "John",
  "surname": "Doe",
  "nickName": "johndoe",
  "email": "john@example.com",
  "age": 25,
  "role": "USER",
  "completedExercises": [
    {
      "id": 1,
      "completedAt": "2024-01-15T10:30:00.000Z",
      "duration": 300,
      "exercise": {
        "id": 1,
        "name": "Push-ups",
        "difficulty": "MEDIUM"
      },
      "program": {
        "id": 1,
        "name": "Strength Training"
      }
    }
  ]
}
```

---

### PATCH /users/:id
**Description**: Update user information (ADMIN only)

**Request Body**:
```json
{
  "name": "Jane",
  "surname": "Smith",
  "nickName": "janesmith",
  "age": 30,
  "role": "ADMIN"
}
```

**Response** (200):
```json
{
  "id": 1,
  "name": "Jane",
  "surname": "Smith",
  "nickName": "janesmith",
  "email": "john@example.com",
  "age": 30,
  "role": "ADMIN"
}
```

---

## User Profile Endpoints

### GET /user-profile
**Description**: Get current user's profile information

**Response** (200):
```json
{
  "id": 1,
  "name": "John",
  "surname": "Doe",
  "nickName": "johndoe",
  "email": "john@example.com",
  "age": 25,
  "role": "USER"
}
```

---

### POST /user-profile/complete-exercise
**Description**: Mark an exercise as completed for a specific program

**Request Body**:
```json
{
  "exerciseID": 1,
  "programID": 2,
  "duration": 300
}
```

**Response** (201):
```json
{
  "id": 1,
  "userID": 1,
  "exerciseID": 1,
  "programID": 2,
  "completedAt": "2024-01-15T10:30:00.000Z",
  "duration": 300
}
```

**Note**: Exercise must be part of the specified program.

---

### GET /user-profile/completed-exercises
**Description**: Get list of user's completed exercises

**Response** (200):
```json
[
  {
    "id": 1,
    "userID": 1,
    "completedAt": "2024-01-15T10:30:00.000Z",
    "duration": 300,
    "exercise": {
      "id": 1,
      "name": "Push-ups",
      "difficulty": "MEDIUM"
    },
    "program": {
      "id": 2,
      "name": "Beginner Workout"
    }
  }
]
```

---

### DELETE /user-profile/completed-exercises/:id
**Description**: Remove a completed exercise from user's history

**Response** (200):
```json
{
  "message": "Completed exercise removed successfully",
  "type": "SUCCESS"
}
```

---

## Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (missing or invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate data)
- **500**: Internal Server Error

## Validation Rules

### User Registration/Update
- Email: Valid email format
- Password: Min 8 characters, uppercase, number, special character
- Age: 1-120 (optional)
- Role: "ADMIN" or "USER"
- Nickname: Unique across users

### Exercise Creation/Update
- Name: 1-200 characters, unique
- Difficulty: "EASY", "MEDIUM", or "HARD"

### Exercise Completion
- ExerciseID: Must exist and be part of specified program
- ProgramID: Must exist
- Duration: Min 1 second

## Localization

The API supports English (en) and Slovak (sk) languages. Set the `Accept-Language` header to receive localized error messages and success responses.

Example with Slovak:
```
Accept-Language: sk
```

Response:
```json
{
  "message": "Cvičenie bolo úspešne vymazané",
  "type": "SUCCESS"
}
```

