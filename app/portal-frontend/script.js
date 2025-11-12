const API_BASE = "/api";

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Response is not valid JSON:", text);
    throw new Error("Request failed");
  }

  if (!res.ok) {
    throw new Error(
      data.detail || data.message || data.error || data.status || "Request failed"
    );
  }
  return data;
}

function setStatus(message, type = "info") {
  const el = document.getElementById("status");
  el.textContent = message;
  el.className = type;
}

async function loadEmployees() {
  try {
    setStatus("Loading employees...", "info");
    const data = await apiRequest("/employees", { method: "GET" });

    const tbody = document.querySelector("#employees-table tbody");
    tbody.innerHTML = "";

    (data.employees || []).forEach((emp) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${emp.id}</td>
        <td>${emp.name}</td>
        <td>${emp.email}</td>
        <td>${emp.department || ""}</td>
        <td>${emp.role || ""}</td>
        <td class="${
          emp.status === "active" ? "ok" : "inactive"
        }">${emp.status}</td>
      `;
      tbody.appendChild(tr);
    });

    setStatus(`Loaded ${data.employees.length} employees.`, "success");
  } catch (err) {
    console.error(err);
    setStatus(`Error loading employees: ${err.message}`, "error");
  }
}

document
  .getElementById("onboard-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("onboard-name").value.trim();
    const email = document.getElementById("onboard-email").value.trim();
    const department = document.getElementById("onboard-dept").value.trim();
    const role = document.getElementById("onboard-role").value.trim();

    if (!name || !email) {
      setStatus("Name and email are required for onboarding.", "error");
      return;
    }

    try {
      setStatus("Onboarding employee...", "info");
      const body = { name, email };
      if (department) body.department = department;
      if (role) body.role = role;

      const res = await apiRequest("/onboard", {
        method: "POST",
        body: JSON.stringify(body),
      });

      setStatus(`Onboarded: ${res.employee.email}`, "success");
      e.target.reset();
      await loadEmployees();
    } catch (err) {
      console.error(err);
      setStatus(`Onboard failed: ${err.message}`, "error");
    }
  });

document
  .getElementById("offboard-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("offboard-email").value.trim();
    if (!email) {
      setStatus("Email is required for offboarding.", "error");
      return;
    }

    try {
      setStatus("Offboarding employee...", "info");
      const res = await apiRequest("/offboard", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (res.status === "not_found") {
        setStatus(`No employee found with email ${email}`, "error");
      } else {
        setStatus(`Offboarded: ${res.employee.email}`, "success");
      }

      e.target.reset();
      await loadEmployees();
    } catch (err) {
      console.error(err);
      setStatus(`Offboard failed: ${err.message}`, "error");
    }
  });

document.getElementById("refresh-btn").addEventListener("click", loadEmployees);

loadEmployees();
