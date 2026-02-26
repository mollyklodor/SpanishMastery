const STORAGE_KEY = "smartGoalQuestDataV2";

const CHECKPOINTS = [
  "Not Started",
  "Planning",
  "Started",
  "Halfway There",
  "Almost There",
  "Completed"
];

const ACHIEVEMENTS = [
  { key: "goal-set", label: "🎯 Goal Starter", check: (student) => Boolean(student.goal) },
  { key: "started", label: "🌱 First Steps", check: (student) => student.checkpointIndex >= 2 },
  { key: "halfway", label: "🔥 Halfway Hero", check: (student) => student.checkpointIndex >= 3 },
  { key: "almost", label: "⚡ Keep Climbing", check: (student) => student.checkpointIndex >= 4 },
  { key: "completed", label: "🏆 Goal Champion", check: (student) => student.checkpointIndex >= 5 }
];

const seedData = {
  teachers: {
    rivera: {
      username: "rivera",
      password: "class123",
      name: "Mr. Rivera",
      days: {
        "day-math-01": {
          code: "DAY-MATH-01",
          name: "Monday Math",
          students: {
            "maya-r": newStudent("Maya", "R"),
            "leo-p": newStudent("Leo", "P"),
            "ava-k": newStudent("Ava", "K")
          }
        }
      }
    }
  }
};

const state = loadData();
let session = null;

const ui = {
  loginView: document.getElementById("loginView"),
  studentView: document.getElementById("studentView"),
  teacherView: document.getElementById("teacherView"),
  showStudentLogin: document.getElementById("showStudentLogin"),
  showTeacherLogin: document.getElementById("showTeacherLogin"),
  studentLoginForm: document.getElementById("studentLoginForm"),
  teacherLoginForm: document.getElementById("teacherLoginForm"),
  studentFirstNameInput: document.getElementById("studentFirstNameInput"),
  studentLastInitialInput: document.getElementById("studentLastInitialInput"),
  studentClassCodeInput: document.getElementById("studentClassCodeInput"),
  teacherUsernameInput: document.getElementById("teacherUsernameInput"),
  teacherPasswordInput: document.getElementById("teacherPasswordInput"),
  studentGreeting: document.getElementById("studentGreeting"),
  studentClassLabel: document.getElementById("studentClassLabel"),
  teacherGreeting: document.getElementById("teacherGreeting"),
  studentLogoutBtn: document.getElementById("studentLogoutBtn"),
  teacherLogoutBtn: document.getElementById("teacherLogoutBtn"),
  goalForm: document.getElementById("goalForm"),
  specificInput: document.getElementById("specificInput"),
  measurableInput: document.getElementById("measurableInput"),
  achievableInput: document.getElementById("achievableInput"),
  relevantInput: document.getElementById("relevantInput"),
  deadlineInput: document.getElementById("deadlineInput"),
  checkpointSelect: document.getElementById("checkpointSelect"),
  saveCheckpointBtn: document.getElementById("saveCheckpointBtn"),
  goalPreview: document.getElementById("goalPreview"),
  achievementList: document.getElementById("achievementList"),
  createDayForm: document.getElementById("createDayForm"),
  dayNameInput: document.getElementById("dayNameInput"),
  dayCodeInput: document.getElementById("dayCodeInput"),
  daySelect: document.getElementById("daySelect"),
  dayMeta: document.getElementById("dayMeta"),
  studentTableWrap: document.getElementById("studentTableWrap"),
  badgeTemplate: document.getElementById("badgeTemplate")
};

ui.showStudentLogin.addEventListener("click", () => toggleLoginType("student"));
ui.showTeacherLogin.addEventListener("click", () => toggleLoginType("teacher"));
ui.studentLoginForm.addEventListener("submit", handleStudentLogin);
ui.teacherLoginForm.addEventListener("submit", handleTeacherLogin);
ui.studentLogoutBtn.addEventListener("click", logout);
ui.teacherLogoutBtn.addEventListener("click", logout);
ui.goalForm.addEventListener("submit", saveGoal);
ui.saveCheckpointBtn.addEventListener("click", saveCheckpoint);
ui.createDayForm.addEventListener("submit", createDay);
ui.daySelect.addEventListener("change", renderTeacherTable);

populateCheckpointOptions();
render();

function newStudent(firstName, lastInitial) {
  return {
    firstName: capitalizeWords(firstName),
    lastInitial: String(lastInitial).toUpperCase(),
    goal: null,
    checkpointIndex: 0,
    achievements: []
  };
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return structuredClone(seedData);
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed?.teachers ? parsed : structuredClone(seedData);
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return structuredClone(seedData);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function toggleLoginType(type) {
  const isStudent = type === "student";
  ui.studentLoginForm.classList.toggle("hidden", !isStudent);
  ui.teacherLoginForm.classList.toggle("hidden", isStudent);
  ui.showStudentLogin.classList.toggle("active", isStudent);
  ui.showTeacherLogin.classList.toggle("active", !isStudent);
}

function handleStudentLogin(event) {
  event.preventDefault();

  const firstName = ui.studentFirstNameInput.value.trim();
  const lastInitial = ui.studentLastInitialInput.value.trim().charAt(0).toUpperCase();
  const classCode = ui.studentClassCodeInput.value.trim();

  if (!firstName || !lastInitial || !classCode) return;

  const classMatch = findClassByCode(classCode);
  if (!classMatch) {
    alert("Class code not found. Ask your teacher for the correct code.");
    return;
  }

  const studentKey = `${firstName.toLowerCase()}-${lastInitial.toLowerCase()}`;
  if (!classMatch.day.students[studentKey]) {
    classMatch.day.students[studentKey] = newStudent(firstName, lastInitial);
  }

  session = {
    role: "student",
    teacherUsername: classMatch.teacher.username,
    dayKey: classMatch.dayKey,
    studentKey
  };

  persist();
  render();
}

function handleTeacherLogin(event) {
  event.preventDefault();

  const username = ui.teacherUsernameInput.value.trim().toLowerCase();
  const password = ui.teacherPasswordInput.value;
  const teacher = state.teachers[username];

  if (!teacher || teacher.password !== password) {
    alert("Invalid teacher username or password.");
    return;
  }

  session = { role: "teacher", teacherUsername: username };
  render();
}

function logout() {
  session = null;
  ui.studentLoginForm.reset();
  ui.teacherLoginForm.reset();
  toggleLoginType("student");
  render();
}

function saveGoal(event) {
  event.preventDefault();
  if (!session || session.role !== "student") return;

  const student = getCurrentStudent();
  student.goal = {
    specific: ui.specificInput.value.trim(),
    measurable: ui.measurableInput.value.trim(),
    achievable: ui.achievableInput.value.trim(),
    relevant: ui.relevantInput.value.trim(),
    deadline: ui.deadlineInput.value
  };

  evaluateAchievements(student);
  persist();
  renderStudent();
}

function saveCheckpoint() {
  if (!session || session.role !== "student") return;

  const student = getCurrentStudent();
  student.checkpointIndex = Number(ui.checkpointSelect.value);
  evaluateAchievements(student);
  persist();
  renderStudent();
}

function createDay(event) {
  event.preventDefault();
  if (!session || session.role !== "teacher") return;

  const teacher = state.teachers[session.teacherUsername];
  const code = ui.dayCodeInput.value.trim().toUpperCase();
  const name = ui.dayNameInput.value.trim();
  if (!code || !name) return;

  const codeExists = Boolean(findClassByCode(code));
  if (codeExists) {
    alert("That class code already exists. Use a unique code.");
    return;
  }

  const dayKey = normalizeDayKey(code);
  teacher.days[dayKey] = {
    code,
    name,
    students: {}
  };

  persist();
  ui.createDayForm.reset();
  renderTeacher();
  ui.daySelect.value = dayKey;
  renderTeacherTable();
}

function render() {
  if (!session) {
    ui.loginView.classList.remove("hidden");
    ui.studentView.classList.add("hidden");
    ui.teacherView.classList.add("hidden");
    toggleLoginType("student");
    return;
  }

  ui.loginView.classList.add("hidden");
  if (session.role === "student") {
    ui.studentView.classList.remove("hidden");
    ui.teacherView.classList.add("hidden");
    renderStudent();
    return;
  }

  ui.studentView.classList.add("hidden");
  ui.teacherView.classList.remove("hidden");
  renderTeacher();
}

function renderStudent() {
  const teacher = state.teachers[session.teacherUsername];
  const day = teacher.days[session.dayKey];
  const student = day.students[session.studentKey];

  ui.studentGreeting.textContent = `Hi ${student.firstName} ${student.lastInitial}.`;
  ui.studentClassLabel.textContent = `DAY: ${day.name} (${day.code})`;

  ui.checkpointSelect.value = String(student.checkpointIndex);

  if (student.goal) {
    ui.specificInput.value = student.goal.specific;
    ui.measurableInput.value = student.goal.measurable;
    ui.achievableInput.value = student.goal.achievable;
    ui.relevantInput.value = student.goal.relevant;
    ui.deadlineInput.value = student.goal.deadline;

    ui.goalPreview.classList.remove("empty");
    ui.goalPreview.innerHTML = `
      <strong>Specific:</strong> ${escapeHtml(student.goal.specific)}<br>
      <strong>Measurable:</strong> ${escapeHtml(student.goal.measurable)}<br>
      <strong>Achievable:</strong> ${escapeHtml(student.goal.achievable)}<br>
      <strong>Relevant:</strong> ${escapeHtml(student.goal.relevant)}<br>
      <strong>Deadline:</strong> ${escapeHtml(student.goal.deadline)}<br>
      <strong>Checkpoint:</strong> ${escapeHtml(CHECKPOINTS[student.checkpointIndex])}
    `;
  } else {
    ui.goalForm.reset();
    ui.goalPreview.classList.add("empty");
    ui.goalPreview.textContent = "No goal yet. Save your SMART goal to begin.";
  }

  renderAchievements(student);
}

function renderTeacher() {
  const teacher = state.teachers[session.teacherUsername];
  ui.teacherGreeting.textContent = `${teacher.name}'s Dashboard`;

  const dayEntries = Object.entries(teacher.days);
  ui.daySelect.innerHTML = dayEntries
    .map(([dayKey, day]) => `<option value="${escapeHtml(dayKey)}">${escapeHtml(day.name)} (${escapeHtml(day.code)})</option>`)
    .join("");

  if (dayEntries.length === 0) {
    ui.dayMeta.textContent = "No DAYS yet. Create your first class above.";
    ui.studentTableWrap.innerHTML = "<p class='hint'>No classes to show yet.</p>";
    return;
  }

  if (!ui.daySelect.value || !teacher.days[ui.daySelect.value]) {
    ui.daySelect.value = dayEntries[0][0];
  }

  renderTeacherTable();
}

function renderTeacherTable() {
  if (!session || session.role !== "teacher") return;

  const teacher = state.teachers[session.teacherUsername];
  const activeDay = teacher.days[ui.daySelect.value];
  if (!activeDay) return;

  const students = Object.values(activeDay.students);
  ui.dayMeta.textContent = `${students.length} student(s) in ${activeDay.name}.`;

  if (!students.length) {
    ui.studentTableWrap.innerHTML = "<p class='hint'>No students have logged into this DAY yet.</p>";
    return;
  }

  const rows = students
    .map((student) => {
      const goalSummary = student.goal
        ? `${student.goal.specific.slice(0, 75)}${student.goal.specific.length > 75 ? "..." : ""}`
        : "No goal yet";

      return `
        <tr>
          <td>${escapeHtml(student.firstName)} ${escapeHtml(student.lastInitial)}.</td>
          <td>${escapeHtml(goalSummary)}</td>
          <td><span class="checkpoint-pill">${escapeHtml(CHECKPOINTS[student.checkpointIndex])}</span></td>
          <td>${student.achievements.length}</td>
        </tr>
      `;
    })
    .join("");

  ui.studentTableWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Student</th>
          <th>SMART Goal (Specific preview)</th>
          <th>Checkpoint</th>
          <th>Badges</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderAchievements(student) {
  ui.achievementList.innerHTML = "";
  const unlocked = ACHIEVEMENTS.filter((achievement) => student.achievements.includes(achievement.key));

  if (!unlocked.length) {
    const item = document.createElement("li");
    item.className = "badge-item";
    item.textContent = "No badges yet — keep going!";
    ui.achievementList.appendChild(item);
    return;
  }

  unlocked.forEach((achievement) => {
    const badge = ui.badgeTemplate.content.firstElementChild.cloneNode(true);
    badge.textContent = achievement.label;
    ui.achievementList.appendChild(badge);
  });
}

function evaluateAchievements(student) {
  ACHIEVEMENTS.forEach((achievement) => {
    if (!student.achievements.includes(achievement.key) && achievement.check(student)) {
      student.achievements.push(achievement.key);
    }
  });
}

function populateCheckpointOptions() {
  ui.checkpointSelect.innerHTML = CHECKPOINTS.map((label, index) => `<option value="${index}">${escapeHtml(label)}</option>`).join("");
}

function findClassByCode(classCode) {
  const normalized = classCode.trim().toUpperCase();
  const teachers = Object.values(state.teachers);

  for (const teacher of teachers) {
    for (const [dayKey, day] of Object.entries(teacher.days)) {
      if (day.code.toUpperCase() === normalized) {
        return { teacher, dayKey, day };
      }
    }
  }

  return null;
}

function getCurrentStudent() {
  const teacher = state.teachers[session.teacherUsername];
  const day = teacher.days[session.dayKey];
  return day.students[session.studentKey];
}

function normalizeDayKey(code) {
  return code.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
}

function capitalizeWords(value) {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
