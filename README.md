# SMART Goal Quest (Grades 4–6)

A web app where students build SMART goals and track progress by **checkpoints** (not percentages), while teachers monitor classes called **DAYS**.

## What changed

- **Student login:** first name + last initial + class code.
- **Teacher login:** username + password.
- **Teacher can create multiple DAYS:** each DAY has a unique class code.
- **Teacher dashboard:** pick a DAY to view all students in that class.
- **Progress system:** checkpoint stages (`Not Started` → `Completed`).

## Run locally

```bash
python -m http.server 4173
```

Open: `http://localhost:4173`

## Demo teacher account

- Username: `rivera`
- Password: `class123`

## Seeded DAY / students

- DAY Name: `Monday Math`
- Class Code: `DAY-MATH-01`
- Seeded students: `Maya R`, `Leo P`, `Ava K`
