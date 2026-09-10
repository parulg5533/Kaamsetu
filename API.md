# KaamSetu — REST API Specification (V1)

> **Base URL:** `/api/v1`  
> **Content-Type:** `application/json`  
> **Auth Strategy:** Bearer Token (JWT containing `userId` and `role`). For V1 prototype/development mode, a fast dev phone-login provides an instant session token.

---

## 1. Authentication & Session

### 1.1 Send OTP
`POST /api/v1/auth/send-otp`

- **Request Body:**
```json
{
  "phone": "9876543210"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP sent successfully to 9876543210",
  "dev_otp": "1234" // Provided during MVP pilot testing mode
}
```

---

### 1.2 Verify OTP & Login / Register
`POST /api/v1/auth/verify-otp`

- **Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "1234",
  "role": "WORKER" // "WORKER" | "BUSINESS"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": "7b88ec7b-83c3-4d74-984e-28db4e1e0a2b",
    "phone": "9876543210",
    "name": "Rahul Kumar",
    "role": "WORKER",
    "has_profile": true
  }
}
```

---

## 2. Worker Endpoints

### 2.1 Get Worker Profile
`GET /api/v1/worker/profile`  
*Headers: `Authorization: Bearer <token>`*

- **Response (200 OK):**
```json
{
  "id": "7b88ec7b-83c3-4d74-984e-28db4e1e0a2b",
  "name": "Rahul Kumar",
  "phone": "9876543210",
  "city": "Amritsar",
  "locality": "Ranjit Avenue",
  "latitude": 31.6340,
  "longitude": 74.8723,
  "experience_years": 2.0,
  "expected_wage": 600.0,
  "availability": "AVAILABLE_TODAY",
  "rating": 4.7,
  "rating_count": 32,
  "jobs_completed": 38,
  "attendance_rate": 94.0,
  "skills": [
    { "id": "s1", "name": "Restaurant Helper" },
    { "id": "s2", "name": "Shop Helper" }
  ]
}
```

---

### 2.2 Update Worker Availability
`PUT /api/v1/worker/availability`  
*Headers: `Authorization: Bearer <token>`*

- **Request Body:**
```json
{
  "availability": "AVAILABLE_TODAY" // "AVAILABLE_TODAY" | "AVAILABLE_TOMORROW" | "UNAVAILABLE"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "availability": "AVAILABLE_TODAY"
}
```

---

### 2.3 Get Nearby Jobs Feed
`GET /api/v1/jobs/nearby?lat=31.6340&lng=74.8723&max_distance=5.0`  
*Headers: `Authorization: Bearer <token>`*

- **Response (200 OK):**
```json
{
  "jobs": [
    {
      "id": "job-101",
      "title": "Restaurant Helper",
      "skill_name": "Restaurant Helper",
      "wage": 650.0,
      "food_provided": true,
      "job_date": "2026-09-11",
      "start_time": "10:00:00",
      "end_time": "20:00:00",
      "distance_km": 1.4,
      "business": {
        "id": "bus-1",
        "business_name": "Sharma Restaurant",
        "rating": 4.5,
        "jobs_completed": 24,
        "locality": "Lawrence Road"
      },
      "my_application_status": null
    }
  ]
}
```

---

### 2.4 Apply for a Job
`POST /api/v1/jobs/:jobId/apply`  
*Headers: `Authorization: Bearer <token>`*

- **Response (201 Created):**
```json
{
  "success": true,
  "application": {
    "id": "app-501",
    "job_id": "job-101",
    "worker_id": "7b88ec7b-83c3-4d74-984e-28db4e1e0a2b",
    "status": "APPLIED",
    "applied_at": "2026-09-10T23:30:00Z"
  }
}
```

---

### 2.5 My Applied & Confirmed Jobs
`GET /api/v1/worker/applications`  
*Headers: `Authorization: Bearer <token>`*

- **Response (200 OK):**
```json
{
  "applications": [
    {
      "id": "app-501",
      "status": "ACCEPTED",
      "job": {
        "id": "job-101",
        "title": "Restaurant Helper",
        "wage": 650.0,
        "job_date": "2026-09-11",
        "start_time": "10:00:00",
        "end_time": "20:00:00",
        "locality": "Lawrence Road",
        "business": {
          "business_name": "Sharma Restaurant",
          "phone": "9812345678" // REVEALED ONLY UPON ACCEPTANCE
        }
      }
    }
  ]
}
```

---

## 3. Business Endpoints

### 3.1 Post a New Job
`POST /api/v1/business/jobs`  
*Headers: `Authorization: Bearer <token>`*

- **Request Body:**
```json
{
  "skill_id": "s1",
  "title": "Restaurant Helper",
  "description": "Need helper for kitchen preparation, cutting, and washing dishes.",
  "workers_required": 2,
  "wage": 650.0,
  "food_provided": true,
  "job_date": "2026-09-11",
  "start_time": "10:00",
  "end_time": "20:00",
  "locality": "Lawrence Road",
  "latitude": 31.6375,
  "longitude": 74.8780
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "job": {
    "id": "job-101",
    "title": "Restaurant Helper",
    "status": "OPEN",
    "workers_required": 2,
    "created_at": "2026-09-10T23:30:00Z"
  }
}
```

---

### 3.2 List Business Active Jobs
`GET /api/v1/business/jobs`  
*Headers: `Authorization: Bearer <token>`*

- **Response (200 OK):**
```json
{
  "jobs": [
    {
      "id": "job-101",
      "title": "Restaurant Helper",
      "status": "OPEN",
      "wage": 650.0,
      "workers_required": 2,
      "workers_accepted": 1,
      "job_date": "2026-09-11",
      "applicant_count": 4
    }
  ]
}
```

---

### 3.3 Get Applicants for a Job
`GET /api/v1/business/jobs/:jobId/applicants`  
*Headers: `Authorization: Bearer <token>`*

- **Response (200 OK):**
```json
{
  "applicants": [
    {
      "application_id": "app-501",
      "worker_id": "worker-1",
      "name": "Rahul Kumar",
      "rating": 4.7,
      "jobs_completed": 32,
      "experience_years": 2.0,
      "distance_km": 1.2,
      "status": "APPLIED",
      "phone": null // Hidden until accepted
    }
  ]
}
```

---

### 3.4 Accept Worker Application
`POST /api/v1/applications/:applicationId/accept`  
*Headers: `Authorization: Bearer <token>`*

- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Worker accepted successfully! Phone number is now unlocked.",
  "worker": {
    "name": "Rahul Kumar",
    "phone": "9876543210" // REVEALED
  }
}
```

---

## 4. Completion & Reviews Handshake

### 4.1 Confirm Job Completion
`POST /api/v1/jobs/:jobId/confirm-completion`  
*Headers: `Authorization: Bearer <token>`*

- **Request Body:**
```json
{
  "completed": true,
  "worker_id": "worker-1" // If called by business
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "job_status": "COMPLETED",
  "prompt_review": true
}
```

---

### 4.2 Submit Rating & Review
`POST /api/v1/reviews`  
*Headers: `Authorization: Bearer <token>`*

- **Request Body:**
```json
{
  "job_id": "job-101",
  "to_user_id": "worker-1",
  "rating": 5,
  "feedback_tag": "Punctual & Hardworking",
  "comment": "Came right on time, helped through the entire rush!"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Review submitted successfully"
}
```
