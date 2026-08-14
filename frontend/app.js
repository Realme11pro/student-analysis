const API_URL = "http://127.0.0.1:8000";

const loginPage = document.getElementById("loginPage");
const signupPage = document.getElementById("signupPage");
const mainApp = document.getElementById("mainApp");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const otpForm = document.getElementById("otpForm");
const forgotForm = document.getElementById("forgotForm");
const taskForm = document.getElementById("taskForm");
const goalForm = document.getElementById("goalForm");
const resourceForm = document.getElementById("resourceForm");

const loginMessage = document.getElementById("loginMessage");
const signupMessage = document.getElementById("signupMessage");
const otpMessage = document.getElementById("otpMessage");
const forgotMessage = document.getElementById("forgotMessage");
const goalMessage = document.getElementById("goalMessage");

const goalsList = document.getElementById("goalsList");
const tasksList = document.getElementById("tasksList");
const resourcesList = document.getElementById("resourcesList");
const habitsList = document.getElementById("habitsList");

const totalGoals = document.getElementById("totalGoals");
const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");

const goalBar = document.getElementById("goalBar");
const completedBar = document.getElementById("completedBar");
const completedPercentage = document.getElementById("completedPercentage");

const welcomeUser = document.getElementById("welcomeUser");

function getToken() {
    return localStorage.getItem("access_token");
}

function showLogin() {
    if (loginPage) loginPage.classList.remove("hidden");
    if (signupPage) signupPage.classList.add("hidden");
    if (mainApp) mainApp.classList.add("hidden");
    if (otpForm) otpForm.classList.add("hidden");
    if (forgotForm) forgotForm.classList.add("hidden");
    if (loginForm) loginForm.classList.remove("hidden");
    
    document.getElementById("loginTitle").textContent = "Welcome Back";
    document.getElementById("loginSubtitle").textContent = "Login to continue your journey";
    document.getElementById("signupSwitchText").style.display = "block";
    if (loginMessage) loginMessage.textContent = "";
}

function showSignup() {
    if (loginPage) loginPage.classList.add("hidden");
    if (signupPage) signupPage.classList.remove("hidden");
    if (mainApp) mainApp.classList.add("hidden");
    const secretBox = document.getElementById("secretBox");
    if (secretBox) secretBox.classList.add("hidden");
    if (signupForm) signupForm.style.display = "block";
    const loginSwitchLink = document.getElementById("loginSwitchLink");
    if (loginSwitchLink) loginSwitchLink.style.display = "block";
    if (signupMessage) signupMessage.textContent = "";
}

function showForgotPassword() {
    if (loginForm) loginForm.classList.add("hidden");
    if (otpForm) otpForm.classList.add("hidden");
    if (forgotForm) forgotForm.classList.remove("hidden");
    
    document.getElementById("loginTitle").textContent = "Reset Password";
    document.getElementById("loginSubtitle").textContent = "Verify Google Authenticator Code to update password";
    document.getElementById("signupSwitchText").style.display = "none";
    if (forgotMessage) forgotMessage.textContent = "";
}

function showDashboard() {
    if (loginPage) loginPage.classList.add("hidden");
    if (signupPage) loginPage.classList.add("hidden");
    if (mainApp) mainApp.classList.remove("hidden");
    loadDashboard();
}

function togglePassword(inputId) {
    const passwordInput = document.getElementById(inputId);
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
    } else {
        passwordInput.type = "password";
    }
}

if (signupForm) {
    signupForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const fullName = document.getElementById("regFullName")?.value.trim() || "";
        const email = document.getElementById("signupEmail")?.value.trim() || "";
        const phone = document.getElementById("regPhone")?.value.trim() || "";
        const dob = document.getElementById("regDob")?.value || "";
        const gender = document.getElementById("regGender")?.value || "";
        const college = document.getElementById("regCollege")?.value.trim() || "";
        const course = document.getElementById("regCourse")?.value.trim() || "";
        const semester = document.getElementById("regSemester")?.value.trim() || "";
        const rollNo = document.getElementById("regRollNo")?.value.trim() || "";
        const password = document.getElementById("signupPassword")?.value || "";

        if (signupMessage) signupMessage.textContent = "Creating account...";

        try {
            const response = await fetch(`${API_URL}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: fullName,
                    email: email,
                    phone: phone,
                    dob: dob,
                    gender: gender,
                    college: college,
                    course: course,
                    semester: semester,
                    roll_no: rollNo,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (signupMessage) {
                    signupMessage.style.color = "#ef4444";
                    signupMessage.textContent = data.detail || "Signup failed.";
                }
                return;
            }

            signupForm.style.display = "none";
            const loginSwitchLink = document.getElementById("loginSwitchLink");
            if (loginSwitchLink) loginSwitchLink.style.display = "none";
            
            const displaySecretKey = document.getElementById("displaySecretKey");
            if (displaySecretKey) displaySecretKey.textContent = data.totp_secret;
            
            const secretBox = document.getElementById("secretBox");
            if (secretBox) secretBox.classList.remove("hidden");

            signupForm.reset();
            const loginEmailField = document.getElementById("loginEmail");
            if (loginEmailField) loginEmailField.value = email;

        } catch (error) {
            console.error(error);
            if (signupMessage) {
                signupMessage.style.color = "#ef4444";
                signupMessage.textContent = "Server connection failed.";
            }
        }
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        if (loginMessage) loginMessage.textContent = "Verifying password...";

        try {
            const formData = new URLSearchParams();
            formData.append("username", email);
            formData.append("password", password);

            const response = await fetch(`${API_URL}/login-request-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                if (loginMessage) {
                    loginMessage.style.color = "#ef4444";
                    loginMessage.textContent = data.detail || "Invalid credentials.";
                }
                return;
            }

            loginForm.classList.add("hidden");
            if (otpForm) otpForm.classList.remove("hidden");

        } catch (error) {
            console.error(error);
            if (loginMessage) {
                loginMessage.style.color = "#ef4444";
                loginMessage.textContent = "Server connection failed.";
            }
        }
    });
}

if (otpForm) {
    otpForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const otp = document.getElementById("otpInput").value.trim();

        if (otpMessage) otpMessage.textContent = "Verifying code...";

        try {
            const response = await fetch(`${API_URL}/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, otp: otp })
            });

            const data = await response.json();

            if (!response.ok) {
                if (otpMessage) {
                    otpMessage.style.color = "#ef4444";
                    otpMessage.textContent = data.detail || "Invalid Authenticator Code.";
                }
                return;
            }

            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("user_email", email);
            localStorage.setItem("user_name", data.full_name || email.split('@')[0]);

            setTimeout(() => {
                otpForm.reset();
                showDashboard();
            }, 500);

        } catch (error) {
            console.error(error);
            if (otpMessage) {
                otpMessage.style.color = "#ef4444";
                otpMessage.textContent = "Verification failed.";
            }
        }
    });
}

if (forgotForm) {
    forgotForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("forgotEmail").value.trim();
        const otp = document.getElementById("forgotOtp").value.trim();
        const newPassword = document.getElementById("newPassword").value;

        if (forgotMessage) forgotMessage.textContent = "Resetting password...";

        try {
            const response = await fetch(`${API_URL}/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, otp: otp, new_password: newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                if (forgotMessage) {
                    forgotMessage.style.color = "#ef4444";
                    forgotMessage.textContent = data.detail || "Password reset failed.";
                }
                return;
            }

            if (forgotMessage) {
                forgotMessage.style.color = "#16a34a";
                forgotMessage.textContent = "Password updated successfully! Please login.";
            }

            setTimeout(() => {
                forgotForm.reset();
                showLogin();
            }, 1500);

        } catch (error) {
            if (forgotMessage) {
                forgotMessage.style.color = "#ef4444";
                forgotMessage.textContent = "Server connection failed.";
            }
        }
    });
}

async function loadDashboard() {
    const token = getToken();
    if (!token) {
        showLogin();
        return;
    }

    const userName = localStorage.getItem("user_name") || "Student";
    if (welcomeUser) {
        welcomeUser.textContent = `Welcome, ${userName}`;
    }

    startLiveClock();
    updateStudyDisplay();
    await loadAnalytics();
    await loadGoals();
    await loadTasks();
    await loadResources();
    await loadHabits();
    await loadNotes();
    await loadDeadlines();
}

function authHeaders() {
    const token = getToken();
    return {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };
}

async function loadAnalytics() {
    try {
        const response = await fetch(`${API_URL}/analytics`, { method: "GET", headers: authHeaders() });
        if (response.status === 401) { logout(); return; }
        if (!response.ok) return;

        const data = await response.json();
        const tGoals = data.total_goals || 0;
        const tTasks = data.total_tasks || 0;
        const cTasks = data.completed_tasks || 0;

        if (totalGoals) totalGoals.textContent = tGoals;
        if (totalTasks) totalTasks.textContent = tTasks;
        if (completedTasks) completedTasks.textContent = cTasks;

        if (goalBar) {
            const goalPercent = Math.min((tGoals / 10) * 100, 100);
            goalBar.style.width = `${goalPercent}%`;
        }

        if (completedBar && completedPercentage) {
            const percent = tTasks > 0 ? Math.round((cTasks / tTasks) * 100) : 0;
            completedBar.style.width = `${percent}%`;
            completedPercentage.textContent = `${percent}% Done`;
        }
    } catch (error) { console.error(error); }
}

async function loadGoals() {
    try {
        const response = await fetch(`${API_URL}/goals`, { method: "GET", headers: authHeaders() });
        if (response.status === 401) { logout(); return; }
        if (!response.ok) return;
        const goals = await response.json();
        displayGoals(goals);
    } catch (error) { console.error(error); }
}

async function searchGoals() {
    const query = document.getElementById("goalSearch").value.trim();
    const token = getToken();
    if (!token) return;

    if (query === "") {
        await loadGoals();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/goals/search/?query=${encodeURIComponent(query)}`, {
            method: "GET",
            headers: authHeaders()
        });
        
        if (response.ok) {
            const goals = await response.json();
            displayGoals(goals);
        }
    } catch (error) {
        console.error("Search error:", error);
    }
}

function displayGoals(goals) {
    if (!goalsList) return;
    goalsList.innerHTML = "";
    if (!goals || goals.length === 0) {
        goalsList.innerHTML = "<p style='color: #64748b;'>No goals added yet.</p>";
        return;
    }
    goals.forEach(goal => {
        const goalDiv = document.createElement("div");
        goalDiv.className = "goal-item";
        goalDiv.innerHTML = `
            <div>
                <h3>${escapeHTML(goal.title)}</h3>
                <small>Goal ID: ${goal.id}</small>
            </div>
            <button onclick="deleteGoal(${goal.id})">Delete</button>
        `;
        goalsList.appendChild(goalDiv);
    });
}

if (goalForm) {
    goalForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        const goalInput = document.getElementById("goalInput");
        const title = goalInput ? goalInput.value.trim() : "";
        if (!title) return;

        try {
            const response = await fetch(`${API_URL}/goals`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ title: title })
            });
            if (response.status === 401) { logout(); return; }
            if (response.ok) {
                goalInput.value = "";
                await loadGoals();
                await loadAnalytics();
            }
        } catch (error) { console.error(error); }
    });
}

async function deleteGoal(goalId) {
    if (!confirm("Delete this goal?")) return;
    try {
        const response = await fetch(`${API_URL}/goals/${goalId}`, { method: "DELETE", headers: authHeaders() });
        if (response.status === 401) { logout(); return; }
        if (response.ok) { await loadGoals(); await loadAnalytics(); }
    } catch (error) { console.error(error); }
}

async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`, { method: "GET", headers: authHeaders() });
        if (!response.ok) return;
        const tasks = await response.json();
        displayTasks(tasks);
    } catch (error) { console.error(error); }
}

function displayTasks(tasks) {
    if (!tasksList) return;
    tasksList.innerHTML = "";
    if (!tasks || tasks.length === 0) {
        tasksList.innerHTML = "<p style='color: #64748b;'>No tasks available right now.</p>";
        return;
    }
    tasks.forEach(task => {
        const taskDiv = document.createElement("div");
        taskDiv.className = "goal-item";
        taskDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <input type="checkbox" ${task.is_completed ? "checked" : ""} onclick="toggleTask(${task.id})" style="width: 20px; height: 20px; cursor: pointer;">
                <span style="${task.is_completed ? 'text-decoration: line-through; color: #94a3b8;' : 'font-weight: 500;'}">${escapeHTML(task.title)}</span>
            </div>
            <button onclick="deleteTask(${task.id})" style="background: #ef4444; padding: 8px 14px; border-radius: 8px; color: white;">Delete</button>
        `;
        tasksList.appendChild(taskDiv);
    });
}

async function toggleTask(taskId) {
    try {
        await fetch(`${API_URL}/tasks/${taskId}/toggle`, { method: "PUT", headers: authHeaders() });
        await loadTasks();
        await loadAnalytics();
    } catch (error) { console.error(error); }
}

async function deleteTask(taskId) {
    try {
        await fetch(`${API_URL}/tasks/${taskId}`, { method: "DELETE", headers: authHeaders() });
        await loadTasks();
        await loadAnalytics();
    } catch (error) { console.error(error); }
}

if (taskForm) {
    taskForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        const taskInput = document.getElementById("taskInput");
        const title = taskInput ? taskInput.value.trim() : "";
        if (!title) return;

        try {
            const response = await fetch(`${API_URL}/tasks`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ title: title })
            });
            if (response.ok) {
                taskInput.value = "";
                await loadTasks();
                await loadAnalytics();
            }
        } catch (error) { console.error(error); }
    });
}

function handleCategoryChange() {
    const category = document.getElementById("resCategory").value;
    const container = document.getElementById("inputContainer");
    const submitBtn = document.getElementById("resSubmitBtn");

    if (category === "Google Drive") {
        container.innerHTML = `<input type="file" id="resFileInput" required style="padding: 8px; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 10px; width: 100%;">`;
        if (submitBtn) submitBtn.textContent = "Upload File";
    } else {
        container.innerHTML = `<input type="url" id="resLink" placeholder="Paste Web Link (https://...)" required style="width: 100%;">`;
        if (submitBtn) submitBtn.textContent = "Add Link";
    }
}

async function loadResources() {
    try {
        const response = await fetch(`${API_URL}/resources`, { method: "GET", headers: authHeaders() });
        if (!response.ok) return;
        const resources = await response.json();
        displayResources(resources);
    } catch (error) { console.error(error); }
}

function displayResources(resources) {
    if (!resourcesList) return;
    resourcesList.innerHTML = "";
    if (!resources || resources.length === 0) {
        resourcesList.innerHTML = "<p style='color: #64748b;'>No resources saved yet.</p>";
        return;
    }
    resources.forEach(res => {
        const div = document.createElement("div");
        div.className = "goal-item";
        let finalLink = res.link;
        if (res.category !== "Google Drive" && !finalLink.startsWith("http://") && !finalLink.startsWith("https://")) {
            finalLink = "https://" + finalLink;
        }

        div.innerHTML = `
            <div>
                <h3><a href="${escapeHTML(finalLink)}" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline;">📂 ${escapeHTML(res.title)} ↗</a></h3>
                <small style="background: #eef2ff; color: #4f46e5; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${escapeHTML(res.category)}</small>
            </div>
            <button onclick="deleteResource(${res.id})">Delete</button>
        `;
        resourcesList.appendChild(div);
    });
}

if (resourceForm) {
    resourceForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        const titleEl = document.getElementById("resTitle");
        const category = document.getElementById("resCategory").value;
        if (!titleEl) return;
        const title = titleEl.value.trim();
        if (!title) return;

        let formData = new FormData();
        formData.append("title", title);
        formData.append("category", category);

        let endpoint = `${API_URL}/resources`;
        let requestOptions = {};

        if (category === "Google Drive") {
            const fileInput = document.getElementById("resFileInput");
            if (!fileInput || !fileInput.files[0]) {
                alert("Please select a file from My Files.");
                return;
            }
            formData.append("file", fileInput.files[0]);
            endpoint = `${API_URL}/upload-to-google-drive`;
            requestOptions = {
                method: "POST",
                headers: { "Authorization": `Bearer ${getToken()}` },
                body: formData
            };
        } else {
            const linkEl = document.getElementById("resLink");
            if (!linkEl) return;
            const link = linkEl.value.trim();
            if (!link) return;

            requestOptions = {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ title: title, link: link, category: category })
            };
        }

        try {
            const response = await fetch(endpoint, requestOptions);
            if (response.ok) {
                resourceForm.reset();
                handleCategoryChange();
                await loadResources();
            } else {
                const err = await response.json();
                alert(err.detail || "Operation failed.");
            }
        } catch (error) { console.error(error); }
    });
}

async function deleteResource(resId) {
    try {
        await fetch(`${API_URL}/resources/${resId}`, { method: "DELETE", headers: authHeaders() });
        await loadResources();
    } catch (error) { console.error(error); }
}

async function loadHabits() {
    try {
        const response = await fetch(`${API_URL}/habits`, { method: "GET", headers: authHeaders() });
        if (!response.ok) return;
        const habits = await response.json();
        displayHabits(habits);
    } catch (error) { console.error(error); }
}

function displayHabits(habits) {
    if (!habitsList) return;
    habitsList.innerHTML = "";
    if (!habits || habits.length === 0) {
        habitsList.innerHTML = "<p style='color: #64748b;'>No habits tracked yet.</p>";
        return;
    }
    habits.forEach(habit => {
        const card = document.createElement("div");
        card.style.cssText = "background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;";
        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" ${habit.is_done ? "checked" : ""} onclick="toggleHabit(${habit.id})" style="width: 22px; height: 22px; cursor: pointer;">
                <span style="font-weight: 600; color: #1e293b;">${escapeHTML(habit.title)}</span>
            </div>
            <button onclick="openHabitSites('${escapeHTML(habit.title)}')" style="padding: 6px 14px; background: #4f46e5; color: white; border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer;">Apply</button>
        `;
        habitsList.appendChild(card);
    });
}

function openHabitSites(habitTitle) {
    if (habitTitle === "Practice Coding") {
        window.open("https://leetcode.com", "_blank");
        window.open("https://www.hackerrank.com", "_blank");
        window.open("https://github.com", "_blank");
    } else if (habitTitle === "Daily Reading") {
        window.open("https://medium.com", "_blank");
        window.open("https://dev.to", "_blank");
    } else if (habitTitle === "Exercise") {
        window.open("https://www.fitnessblender.com", "_blank");
        window.open("https://www.youtube.com/results?search_query=workout+routine", "_blank");
    } else {
        alert("No specific website linked for " + habitTitle);
    }
}

async function toggleHabit(habitId) {
    try {
        await fetch(`${API_URL}/habits/${habitId}/toggle`, { method: "PUT", headers: authHeaders() });
        await loadHabits();
    } catch (error) { console.error(error); }
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
        document.body.style.backgroundColor = "#121212";
        document.body.style.color = "#ffffff";
    } else {
        document.body.style.backgroundColor = "#f8f9fa";
        document.body.style.color = "#000000";
    }
}

function calculateCGPA() {
    let marks = parseFloat(document.getElementById("cgpaInput").value);
    if (isNaN(marks)) {
        alert("Please enter valid marks!");
        return;
    }
    let cgpa = (marks / 9.5).toFixed(2);
    if (marks > 100) cgpa = (marks / 10).toFixed(2);
    document.getElementById("cgpaResult").innerText = "Estimated CGPA: " + cgpa;
}

async function saveNote() {
    let title = document.getElementById("noteTitle").value.trim();
    let content = document.getElementById("noteContent").value.trim();
    if (!title || !content) return;

    try {
        const response = await fetch(`${API_URL}/notes`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ title, content })
        });
        if (response.ok) {
            document.getElementById("noteForm").reset();
            await loadNotes();
        }
    } catch (error) { console.error(error); }
}

async function loadNotes() {
    try {
        const response = await fetch(`${API_URL}/notes`, { method: "GET", headers: authHeaders() });
        if (!response.ok) return;
        const notes = await response.json();
        const notesList = document.getElementById("notesList");
        if (!notesList) return;
        
        notesList.innerHTML = "";
        if (!notes || notes.length === 0) {
            notesList.innerHTML = "<p style='color: #64748b;'>No notes saved yet.</p>";
            return;
        }
        notes.forEach(note => {
            const div = document.createElement("div");
            div.className = "goal-item";
            div.innerHTML = `
                <div>
                    <h3>${escapeHTML(note.title)}</h3>
                    <p style="font-size: 14px; color: #475569; margin-top: 4px;">${escapeHTML(note.content)}</p>
                </div>
            `;
            notesList.appendChild(div);
        });
    } catch (error) { console.error(error); }
}

async function addDeadline() {
    let title = document.getElementById("dlTitle").value.trim();
    let date = document.getElementById("dlDate").value;
    if (!title || !date) return;

    try {
        const response = await fetch(`${API_URL}/deadlines`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ title, date })
        });
        if (response.ok) {
            document.getElementById("deadlineForm").reset();
            await loadDeadlines();
        }
    } catch (error) { console.error(error); }
}

async function loadDeadlines() {
    try {
        const response = await fetch(`${API_URL}/deadlines`, { method: "GET", headers: authHeaders() });
        if (!response.ok) return;
        const deadlines = await response.json();
        const deadlineList = document.getElementById("deadlineList");
        if (!deadlineList) return;

        deadlineList.innerHTML = "";
        if (!deadlines || deadlines.length === 0) {
            deadlineList.innerHTML = "<p style='color: #64748b;'>No deadlines added yet.</p>";
            return;
        }
        deadlines.forEach(dl => {
            const div = document.createElement("div");
            div.className = "goal-item";
            div.innerHTML = `
                <div>
                    <h3>${escapeHTML(dl.title)}</h3>
                    <small style="color: #e11d48; font-weight: bold;">Due Date: ${escapeHTML(dl.date)}</small>
                </div>
            `;
            deadlineList.appendChild(div);
        });
    } catch (error) { console.error(error); }
}

function startLiveClock() {
    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const clockElement = document.getElementById("liveClock");
        if (clockElement) {
            clockElement.textContent = timeString;
        }
    }
    updateClock();
    setInterval(updateClock, 1000);
}

let studyInterval;
let studyTimeLeft = 60 * 60;

function startStudyTimer() {
    clearInterval(studyInterval);
    studyInterval = setInterval(() => {
        if (studyTimeLeft > 0) {
            studyTimeLeft--;
            updateStudyDisplay();
        } else {
            clearInterval(studyInterval);
            alert("1 Hour focus session completed! Take a short break.");
            studyTimeLeft = 60 * 60;
            updateStudyDisplay();
        }
    }, 1000);
}

function resetStudyTimer() {
    clearInterval(studyInterval);
    studyTimeLeft = 60 * 60;
    updateStudyDisplay();
}

function updateStudyDisplay() {
    const minutes = Math.floor(studyTimeLeft / 60);
    const seconds = studyTimeLeft % 60;
    const display = document.getElementById("timerDisplay");
    if (display) {
        display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

const deleteAccountBtn = document.getElementById("deleteAccountBtn");
if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", async function() {
        if (!confirm("Are you sure you want to delete your account?")) return;
        const email = localStorage.getItem("user_email");
        try {
            const response = await fetch(`${API_URL}/delete-account?email=${encodeURIComponent(email)}`, { method: "DELETE", headers: authHeaders() });
            if (response.ok) { alert("Account deleted successfully."); logout(); }
        } catch (error) { console.error(error); }
    });
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) { logoutBtn.addEventListener("click", logout); }

function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    showLogin();
}

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", function() {
    if (getToken()) { showDashboard(); } else { showLogin(); }
});