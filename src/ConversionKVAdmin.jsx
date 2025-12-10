import React, { useEffect, useState } from "react";

export default function ConversionKVAdmin() {
  const [experiments, setExperiments] = useState({});
  const [editingKey, setEditingKey] = useState("");
  const [key, setKey] = useState("");
  const [target, setTarget] = useState("");
  const [sample, setSample] = useState(100);
  const [status, setStatus] = useState("Build");
  const [variations, setVariations] = useState([
    { name: "control", split: 50, type: "none", code: "" },
    { name: "", split: 50, type: "", code: "" },
  ]);

  // Load all experiments on first render
  useEffect(() => {
    fetch("/api/list-experiments")
      .then((res) => res.json())
      .then(setExperiments)
      .catch((err) => console.error("Error fetching experiments", err));
  }, []);

  const resetForm = () => {
    setKey("");
    setTarget("");
    setSample(100);
    setStatus("Build");
    setVariations([
      { name: "control", split: 50, type: "none", code: "" },
      { name: "", split: 50, type: "", code: "" },
    ]);
    setEditingKey("");
  };

  const saveExperiment = async () => {
    const data = { target, sample, status, variations };

    try {
      const res = await fetch(`/api/save-experiments?key=${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      alert("Saved!");
      resetForm();

      // Reload list
      const updated = await fetch("/api/list-experiments").then((r) =>
        r.json()
      );
      setExperiments(updated);
    } catch (err) {
      console.error("KV Save failed:", err);
      alert("Error saving experiment:\nKV Save failed: " + err.message);
    }
  };

  const editExperiment = (key, data) => {
    setKey(key);
    setTarget(data.target);
    setSample(data.sample);
    setStatus(data.status || "Build");
    setVariations(data.variations);
    setEditingKey(key);
  };

  const deleteExperiment = async (key) => {
    if (!confirm(`Delete experiment "${key}"?`)) return;

    await fetch(`/api/delete-experiment?key=${key}`, { method: "DELETE" });
    const updated = await fetch("/api/list-experiments").then((r) =>
      r.json()
    );
    setExperiments(updated);
  };

  const updateVariation = (i, field, value) => {
    const next = [...variations];
    next[i][field] = value;
    setVariations(next);
  };

  const addVariation = () => {
    setVariations([...variations, { name: "", split: 0, type: "", code: "" }]);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Conversion Workers – KV Admin</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Experiment Name"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          style={{ marginRight: 10 }}
        />
        <input
          placeholder="Target Page (e.g. /homepage)"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          style={{ marginRight: 10 }}
        />
        <input
          type="number"
          placeholder="Sample %"
          value={sample}
          onChange={(e) => setSample(Number(e.target.value))}
          style={{ width: 60, marginRight: 10 }}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ marginRight: 10 }}
        >
          <option>Build</option>
          <option>QA</option>
          <option>Live</option>
          <option>Completed</option>
        </select>
      </div>

      <h2>Variations</h2>
      {variations.map((v, i) => (
        <div key={i} style={{ display: "flex", marginBottom: 10 }}>
          <input
            value={v.name}
            placeholder="Name"
            onChange={(e) => updateVariation(i, "name", e.target.value)}
            style={{ width: 100, marginRight: 5 }}
          />
          <input
            value={v.split}
            placeholder="Split %"
            type="number"
            onChange={(e) => updateVariation(i, "split", Number(e.target.value))}
            style={{ width: 60, marginRight: 5 }}
          />
          <select
            value={v.type}
            onChange={(e) => updateVariation(i, "type", e.target.value)}
            style={{ width: 100, marginRight: 5 }}
          >
            <option value="">Select Type</option>
            <option value="none">none</option>
            <option value="css">css</option>
            <option value="js">js</option>
            <option value="html">html</option>
            <option value="redirect">redirect</option>
          </select>
          <textarea
            placeholder="Code"
            value={v.code}
            onChange={(e) => updateVariation(i, "code", e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
      ))}
      <button onClick={addVariation}>Add Variation</button>

      <div style={{ marginTop: 20 }}>
        <button onClick={saveExperiment} style={{ marginRight: 10 }}>
          Save Experiment
        </button>
        <button onClick={resetForm}>Reset</button>
      </div>

      <hr style={{ margin: "30px 0" }} />

      {["Build", "QA", "Live", "Completed"].map((group) => {
        const items = Object.entries(experiments).filter(
          ([, data]) => data.status === group
        );

        if (items.length === 0) return null;

        return (
          <div key={group}>
            <h2>{group} Experiments</h2>
            <ul>
              {items.map(([k, d]) => (
                <li key={k} style={{ marginBottom: 20 }}>
                  <strong>{k}</strong>
                  <div>Target: {d.target}</div>
                  <div>Sample: {d.sample}%</div>
                  <div>Status: {d.status}</div>
                  <div>
                    Variations:
                    <ul>
                      {d.variations.map((v, i) => (
                        <li key={i}>
                          <strong>{v.name}</strong> – {v.split}% – {v.type}
                          {v.code && (
                            <div style={{ fontSize: "0.8em", marginLeft: 10 }}>
                              <pre>{v.code.slice(0, 120)}...</pre>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={() => editExperiment(k, d)}>Edit</button>
                  <button
                    onClick={() => deleteExperiment(k)}
                    style={{ marginLeft: 10 }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
