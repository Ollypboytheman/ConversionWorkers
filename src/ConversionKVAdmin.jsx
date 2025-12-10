import React, { useEffect, useState } from "react";

export default function ConversionKVAdmin() {
  const [experiments, setExperiments] = useState({});
  const [formKey, setFormKey] = useState("");
  const [target, setTarget] = useState("");
  const [sample, setSample] = useState(100);
  const [status, setStatus] = useState("Build");
  const [variations, setVariations] = useState([{ name: "control", split: 50, type: "none", code: "" }]);

  useEffect(() => {
    fetch("/api/get-experiments")
      .then(res => res.json())
      .then(data => setExperiments(data))
      .catch(err => console.error("Failed to fetch experiments", err));
  }, []);

  const resetForm = () => {
    setFormKey("");
    setTarget("");
    setSample(100);
    setStatus("Build");
    setVariations([{ name: "control", split: 50, type: "none", code: "" }]);
  };

  const saveExperiment = async () => {
    const data = { target, sample, status, variations };
    const res = await fetch(`/api/save-experiments?key=${formKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      alert("Saved");
      const updated = await fetch("/api/get-experiments").then(res => res.json());
      setExperiments(updated);
      resetForm();
    } else {
      const error = await res.json().catch(() => ({}));
      alert("Error saving experiment: " + (error.message || "Unknown"));
    }
  };

  const deleteExperiment = async (key) => {
    if (!confirm(`Delete experiment "${key}"?`)) return;
    await fetch(`/api/delete-experiment?key=${key}`, { method: "DELETE" });
    const updated = await fetch("/api/get-experiments").then(res => res.json());
    setExperiments(updated);
  };

  const editExperiment = (key, data) => {
    setFormKey(key);
    setTarget(data.target || "");
    setSample(data.sample || 100);
    setStatus(data.status || "Build");
    setVariations(data.variations || []);
  };

  const addVariation = () => {
    setVariations([...variations, { name: "", split: 0, type: "none", code: "" }]);
  };

  const updateVariation = (index, field, value) => {
    const updated = [...variations];
    updated[index][field] = value;
    setVariations(updated);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Conversion Workers – KV Admin</h1>

      <div style={{ marginBottom: "2rem", borderBottom: "1px solid #ccc", paddingBottom: "1rem" }}>
        <input placeholder="Experiment Name" value={formKey} onChange={(e) => setFormKey(e.target.value)} />
        <input placeholder="Target Page (e.g. /homepage)" value={target} onChange={(e) => setTarget(e.target.value)} />
        <input type="number" placeholder="Sample %" value={sample} onChange={(e) => setSample(Number(e.target.value))} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {["Build", "QA", "Live", "Completed"].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <h2>Variations</h2>
        {variations.map((v, i) => (
          <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <input value={v.name} onChange={(e) => updateVariation(i, "name", e.target.value)} placeholder="Name" />
            <input value={v.split} onChange={(e) => updateVariation(i, "split", Number(e.target.value))} placeholder="Split %" type="number" />
            <select value={v.type} onChange={(e) => updateVariation(i, "type", e.target.value)}>
              <option value="none">none</option>
              <option value="js">js</option>
              <option value="html">html</option>
            </select>
            <textarea
              value={v.code}
              onChange={(e) => updateVariation(i, "code", e.target.value)}
              placeholder="Code"
              rows={2}
              style={{ flex: 1 }}
            />
          </div>
        ))}
        <button onClick={addVariation}>Add Variation</button> &nbsp;
        <button onClick={saveExperiment}>Save Experiment</button> &nbsp;
        <button onClick={resetForm}>Reset</button>
      </div>

      {["Build", "QA", "Live", "Completed"].map(group => (
        <div key={group} style={{ marginBottom: "2rem" }}>
          <h2>{group} Experiments</h2>
          <ul>
            {Object.entries(experiments)
              .filter(([_, data]) => data.status === group)
              .map(([key, data]) => (
                <li key={key} style={{ marginBottom: "1rem" }}>
                  <strong>{key}</strong>
                  <div>Target: {data.target}</div>
                  <div>Sample: {data.sample}%</div>
                  <div>Status: {data.status}</div>
                  <div>Variations:
                    <ul>
                      {data.variations.map((v, i) => (
                        <li key={i}>
                          <strong>{v.name}</strong> ({v.split}%) — {v.type || "none"}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={() => editExperiment(key, data)}>Edit</button> &nbsp;
                  <button onClick={() => deleteExperiment(key)}>Delete</button>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
