# AI Question Engine - Curl Reference

Set variabel:

```bash
BASE="http://localhost:8080/api/v1"
ADMIN_TOKEN="<JWT_ADMIN>"
STUDENT_TOKEN="<JWT_STUDENT>"
GURU_TOKEN="<JWT_GURU>"
```

## Admin

### Catatan seeding

Saat ini endpoint CRUD `ai_questions` khusus admin belum tersedia. Seeding awal dapat dilakukan via SQL/DB tool.

### Ranking nasional (public)

```bash
curl -s "$BASE/ranking?limit=20"
```

### Bank soal terfilter (public)

```bash
curl -s "$BASE/questions?subject=math&grade=smp&topic=graph&difficulty=hard&limit=20"
```

### Subscription akun admin (auth)

```bash
curl -s -X POST "$BASE/subscription" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planCode": "pro_monthly",
    "startAt": "2026-04-07T00:00:00Z",
    "endAt": "2026-05-07T00:00:00Z"
  }'
```

## Siswa

### Generate soal olimpiade

```bash
curl -s -X POST "$BASE/generate-questions" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "math",
    "grade": "smp",
    "topic": "graph",
    "difficulty": "olympiad",
    "count": 10
  }'
```

### Submit jawaban

```bash
curl -s -X POST "$BASE/submit-answer" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "9e8d7c6b-1234-4f3a-a111-222233334444",
    "answer": "B",
    "timeSpentMs": 92000
  }'
```

### Analisis performa + rekomendasi

```bash
curl -s "$BASE/analysis?topic=graph&grade=smp" \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

### Ranking nasional

```bash
curl -s "$BASE/ranking?limit=50"
```

### Latihan bebas (list soal)

```bash
curl -s "$BASE/questions?subject=math&grade=smp&topic=aritmatika&difficulty=medium&limit=15"
```

### Subscription siswa

```bash
curl -s -X POST "$BASE/subscription" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planCode": "student_plus"
  }'
```

## Guru

### Generate soal (Informatika SMA)

```bash
curl -s -X POST "$BASE/generate-questions" \
  -H "Authorization: Bearer $GURU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "informatics",
    "grade": "sma",
    "topic": "dp",
    "difficulty": "hard",
    "count": 20
  }'
```

### Submit jawaban

```bash
curl -s -X POST "$BASE/submit-answer" \
  -H "Authorization: Bearer $GURU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "aabbccdd-eeee-1111-2222-333344445555",
    "answer": "C",
    "timeSpentMs": 130000
  }'
```

### Analisis performa guru

```bash
curl -s "$BASE/analysis?topic=dp&grade=sma" \
  -H "Authorization: Bearer $GURU_TOKEN"
```

### Ranking nasional

```bash
curl -s "$BASE/ranking?limit=20"
```

### List soal assignment/manual share

```bash
curl -s "$BASE/questions?subject=informatics&grade=sma&topic=graph&difficulty=olympiad&limit=20"
```

### Subscription guru

```bash
curl -s -X POST "$BASE/subscription" \
  -H "Authorization: Bearer $GURU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planCode": "teacher_pro"
  }'
```

## Error Handling Frontend

### 401 Unauthorized

```json
{"error":{"code":"unauthorized","message":"not authenticated"}}
```

### 400 Validation Error

```json
{"error":{"code":"validation_error","message":"subject, grade, topic, count required"}}
```

### 503 Service Unavailable

```json
{"error":{"code":"service_unavailable","message":"question generator unavailable"}}
```
