<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Conversion Workers – KV Admin</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 2rem;
    }
    input, select, textarea, button {
      margin: 0.25rem 0.5rem 0.5rem 0;
    }
    .experiment-group {
      margin-top: 2rem;
    }
    .experiment-group h2 {
      margin-bottom: 0.5rem;
      border-bottom: 1px solid #ccc;
    }
    .experiment-item {
      margin: 0.5rem 0;
    }
    .btn {
      margin-left: 0.5rem;
      padding: 2px 8px;
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <h1>Conversion Workers – KV Admin</h1>

  <label>Experiment Key: <input id="experiment-key" placeholder="e.g. homepage-banner" /></label>
  <label>Target Page: <input id="target" placeholder="/homepage" /></label>
  <label>Sample %: <input id="sample" type="number" value="100" /></label>
  <label>Status: 
    <select id="experiment-status">
      <option value="Build">Build</option>
      <option value="QA">QA</option>
      <option value="Live">Live</option>
      <option value="Completed">Completed</option>
    </select>
  </label>

  <h2>Variations</h2>
  <div id="variations"></div>
  <button onclick="addVariation()">Add Variation</button><br><br>

  <button onclick="saveExperiment()">💾 Save Experiment</button>
  <button onclick="resetForm()">Reset</button>

  <div id="experiments-container"></div>

  <script>
    const API_BASE = "/api";

    const variationHTML = (name = "", split = 50, type = "none", code = "") => `
      <div class="variation">
        <input placeholder="Name" value="${name}" />
        <input placeholder="Split %" type="number" value="${split}" />
        <select>
          <option value="none" ${type === "none" ? "selected" : ""}>none</option>
          <option value="html" ${type === "html" ? "selected" : ""}>html</option>
          <option value="js" ${type === "js" ? "selected" : ""}>js</option>
        </select>
        <textarea placeholder="Code (HTML/JS for variation)">${code}</textarea>
      </div>
    `;

    function addVariation(name, split, type, code) {
      const div = document.createElement("div");
      div.innerHTML = variationHTML(name, split, type, code);
      document.getElementById("variations").appendChild(div);
    }

    function resetForm() {
      document.getElementById("experiment-key").value = "";
      document.getElementById("target").value = "";
      document.getElementById("sample").value = 100;
      document.getElementById("experiment-status").value = "Build";
      document.getElementById("variations").innerHTML = "";
    }

    async function saveExperiment() {
      const key = document.getElementById("experiment-key").value;
      const target = document.getElementById("target").value;
      const sample = parseInt(document.getElementById("sample").value, 10);
      const status = document.getElementById("experiment-status").value;

      const variationDivs = document.querySelectorAll(".variation");
      const variations = Array.from(variationDivs).map(div => {
        const [nameInput, splitInput, typeSelect, codeTextarea] = div.querySelectorAll("input, select, textarea");
        return {
          name: nameInput.value,
          split: parseInt(splitInput.value, 10),
          type: typeSelect.value,
          code: codeTextarea.value,
        };
      });

      const experimentData = {
        key,
        target,
        sample,
        status,
        variations
      };

      const res = await fetch(`${API_BASE}/save-experiments?key=${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(experimentData)
      });

      if (res.ok) {
        alert("Experiment saved to KV!");
        loadExperiments();
        resetForm();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Error saving experiment:\n${err.message || res.statusText}`);
      }
    }

    async function deleteExperiment(key) {
      if (!confirm("Are you sure you want to delete this experiment?")) return;
      await fetch(`${API_BASE}/delete-experiment?key=${encodeURIComponent(key)}`, { method: "DELETE" });
      loadExperiments();
    }

    async function endExperiment(key) {
      const res = await fetch(`${API_BASE}/update-experiment?key=${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" })
      });
      loadExperiments();
    }

    function editExperiment(data) {
      document.getElementById("experiment-key").value = data.key;
      document.getElementById("target").value = data.target || "";
      document.getElementById("sample").value = data.sample || 100;
      document.getElementById("experiment-status").value = data.status || "Build";
      document.getElementById("variations").innerHTML = "";
      (data.variations || []).forEach(v => {
        addVariation(v.name, v.split, v.type, v.code);
      });
    }

    async function loadExperiments() {
      const res = await fetch(`${API_BASE}/list-experiments`);
      const experiments = await res.json();

      const grouped = {
        Build: [],
        QA: [],
        Live: [],
        Completed: [],
      };

      for (const exp of experiments) {
        grouped[exp.status || "Build"].push(exp);
      }

      const container = document.getElementById("experiments-container");
      container.innerHTML = "";

      for (const status of ["Build", "QA", "Live", "Completed"]) {
        const group = document.createElement("div");
        group.className = "experiment-group";
        group.innerHTML = `<h2>${status} Experiments</h2>`;
        grouped[status].forEach(exp => {
          const div = document.createElement("div");
          div.className = "experiment-item";
          div.innerHTML = `
            <strong>${exp.key}</strong> — Target: ${exp.target}, Sample: ${exp.sample}% 
            | Variations: ${exp.variations.map(v => v.name).join(", ")}
            <button class="btn" onclick='editExperiment(${JSON.stringify(exp)})'>✏️ Edit</button>
            <button class="btn" onclick='endExperiment("${exp.key}")'>⏹ End</button>
            <button class="btn" onclick='deleteExperiment("${exp.key}")'>🗑 Delete</button>
          `;
          group.appendChild(div);
        });
        container.appendChild(group);
      }
    }

    loadExperiments();
  </script>
</body>
</html>
