import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ConversionKVAdmin() {
  const [experimentKey, setExperimentKey] = useState("");
  const [targetPage, setTargetPage] = useState("");
  const [sampleRate, setSampleRate] = useState("100");
  const [status, setStatus] = useState("Build");
  const [variations, setVariations] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [editing, setEditing] = useState(false);

  // Fetch from KV on mount
  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/save-experiments");
      const json = await res.json();
      const list = Object.entries(json).map(([key, config]) => ({
        key,
        ...config,
      }));
      setExperiments(list);
    };
    load();
  }, []);

  // Init control group
  useEffect(() => {
    setVariations([
      {
        name: "control",
        split: "",
        type: "none",
        code: "",
        isControl: true,
      },
    ]);
  }, []);

  const addVariation = () => {
    setVariations([
      ...variations,
      { name: "", split: "", type: "", code: "", isControl: false },
    ]);
  };

  const updateVariation = (index, field, value) => {
    const copy = [...variations];
    copy[index][field] = value;
    setVariations(copy);
  };

  const resetForm = () => {
    setExperimentKey("");
    setTargetPage("");
    setSampleRate("100");
    setStatus("Build");
    setVariations([
      { name: "control", split: "", type: "none", code: "", isControl: true },
    ]);
    setEditing(false);
  };

  const handleSubmit = async () => {
    const total = variations.reduce(
      (acc, v) => acc + parseFloat(v.split || 0),
      0
    );
    if (total !== 100) {
      alert("Total variation split % must equal 100%");
      return;
    }

    const payload = {
      target: targetPage,
      sample: parseFloat(sampleRate),
      status,
      variations: variations.map((v) => ({
        name: v.name,
        split: parseFloat(v.split || 0),
        type: v.type,
        code: v.code,
      })),
    };

    try {
      const res = await fetch(
        `/api/save-experiments?key=${encodeURIComponent(experimentKey)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error(await res.text());

      const updated = [
        ...experiments.filter((e) => e.key !== experimentKey),
        { key: experimentKey, ...payload },
      ];
      setExperiments(updated);
      resetForm();
      alert("Experiment saved!");
    } catch (err) {
      alert("Save error:\n" + err.message);
    }
  };

  const handleDelete = async (key) => {
    if (!window.confirm("Delete this experiment?")) return;
    try {
      const res = await fetch(`/api/save-experiments?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      setExperiments(experiments.filter((e) => e.key !== key));
    } catch (err) {
      alert("Delete failed:\n" + err.message);
    }
  };

  const handleEdit = (exp) => {
    setExperimentKey(exp.key);
    setTargetPage(exp.target);
    setSampleRate(String(exp.sample));
    setStatus(exp.status || "Build");
    setVariations([
      { name: "control", split: "", type: "none", code: "", isControl: true },
      ...exp.variations.filter((v) => v.name !== "control"),
    ]);
    setEditing(true);
  };

  const bucketed = {
    Build: [],
    QA: [],
    Live: [],
    Completed: [],
  };

  for (const exp of experiments) {
    const s = exp.status || "Build";
    if (!bucketed[s]) bucketed[s] = [];
    bucketed[s].push(exp);
  }

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold mb-2">Conversion Workers – KV Admin</h1>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <Input
            placeholder="Experiment Key"
            value={experimentKey}
            onChange={(e) => setExperimentKey(e.target.value)}
            disabled={editing}
          />
          <Input
            placeholder="Target Page (e.g. /homepage)"
            value={targetPage}
            onChange={(e) => setTargetPage(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Sample %"
            value={sampleRate}
            onChange={(e) => setSampleRate(e.target.value)}
            min={1}
            max={100}
          />
          <select
            className="border p-2 rounded"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Build">Build</option>
            <option value="QA">QA</option>
            <option value="Live">Live</option>
            <option value="Completed">Completed</option>
          </select>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Variations</h2>
            {variations.map((v, i) => (
              <div key={i} className="border p-2 mb-2 rounded bg-gray-50 space-y-2">
                <Input
                  placeholder="Name"
                  value={v.name}
                  onChange={(e) => updateVariation(i, "name", e.target.value)}
                  disabled={v.isControl}
                />
                <Input
                  type="number"
                  placeholder="Split %"
                  value={v.split}
                  onChange={(e) => updateVariation(i, "split", e.target.value)}
                />
                <Input
                  placeholder="Type"
                  value={v.type}
                  onChange={(e) => updateVariation(i, "type", e.target.value)}
                />
                <Textarea
                  placeholder="Code"
                  value={v.code}
                  onChange={(e) => updateVariation(i, "code", e.target.value)}
                />
              </div>
            ))}
            <Button type="button" onClick={addVariation}>
              Add Variation
            </Button>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" onClick={handleSubmit}>
              {editing ? "Update" : "Save"} Experiment
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {Object.entries(bucketed).map(([bucket, items]) => (
        <div key={bucket}>
          <h2 className="text-xl font-bold mt-8 mb-2">{bucket} Experiments</h2>
          {items.length === 0 ? (
            <div className="text-gray-500">None</div>
          ) : (
            <ul className="space-y-2">
              {items.map((exp) => (
                <li key={exp.key} className="border rounded p-3">
                  <div className="font-bold text-md mb-1">{exp.key}</div>
                  <div className="text-sm mb-2">
                    Target: {exp.target} | Sample: {exp.sample}% | Status: {exp.status} | Variations:{" "}
                    {exp.variations.map((v) => v.name).join(", ")}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEdit(exp)} className="bg-orange-500 hover:bg-orange-600">
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(exp.key)}
                      variant="destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
