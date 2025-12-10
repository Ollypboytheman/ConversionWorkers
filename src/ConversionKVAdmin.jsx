import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const STATUS_OPTIONS = ["Build", "QA", "Live", "Completed"];

export default function ConversionKVAdmin() {
  const [experimentKey, setExperimentKey] = useState("");
  const [targetPage, setTargetPage] = useState("");
  const [sampleRate, setSampleRate] = useState("100");
  const [variations, setVariations] = useState([]);
  const [status, setStatus] = useState("Build");
  const [experiments, setExperiments] = useState([]);

  // Load all experiments from KV on mount
  useEffect(() => {
    fetch("/api/get-experiments")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setExperiments(data);
        } else {
          console.error("Unexpected data format", data);
        }
      })
      .catch((err) => console.error("Failed to load experiments", err));
  }, []);

  // Initialise control group on mount
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
      key: experimentKey,
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

      if (!res.ok) {
        const err = await res.text();
        throw new Error("KV Save failed: " + err);
      }

      const updated = [
        ...experiments.filter((e) => e.key !== experimentKey),
        payload,
      ];
      setExperiments(updated);
      resetForm();
      alert("Experiment saved to KV!");
    } catch (err) {
      alert("Error saving experiment:\n" + err.message);
    }
  };

  const handleDelete = async (key) => {
    if (!confirm(`Are you sure you want to delete '${key}'?`)) return;
    try {
      await fetch(`/api/delete-experiment?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      setExperiments(experiments.filter((e) => e.key !== key));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const startEdit = (exp) => {
    setExperimentKey(exp.key);
    setTargetPage(exp.target);
    setSampleRate(String(exp.sample));
    setStatus(exp.status || "Build");
    setVariations([
      { name: "control", split: "", type: "none", code: "", isControl: true },
      ...exp.variations.map((v) => ({ ...v, isControl: false })),
    ]);
  };

  const experimentsByStatus = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = experiments.filter((e) => e.status === s);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Conversion Workers – KV Admin</h1>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Input
            placeholder="Experiment Key (e.g. homepage_test_v1)"
            value={experimentKey}
            onChange={(e) => setExperimentKey(e.target.value)}
          />
          <Input
            placeholder="Target Page (e.g. /homepage)"
            value={targetPage}
            onChange={(e) => setTargetPage(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Sample % (default: 100)"
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
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Variations</h2>
            {variations.map((v, i) => (
              <div key={i} className="border p-2 rounded bg-gray-50 space-y-2">
                <Input
                  placeholder="Variation Name"
                  value={v.name}
                  onChange={(e) => updateVariation(i, "name", e.target.value)}
                  disabled={v.isControl}
                />
                <Input
                  type="number"
                  placeholder="Split %"
                  value={v.split}
                  onChange={(e) => updateVariation(i, "split", e.target.value)}
                  min={0}
                  max={100}
                />
                <Input
                  placeholder="Type (e.g. html, js, none)"
                  value={v.type}
                  onChange={(e) => updateVariation(i, "type", e.target.value)}
                />
                <Textarea
                  placeholder="Code (HTML/JS for variation)"
                  value={v.code}
                  onChange={(e) => updateVariation(i, "code", e.target.value)}
                />
                {v.isControl && <span className="text-xs text-gray-700">Control</span>}
              </div>
            ))}
            <Button type="button" onClick={addVariation}>
              Add Variation
            </Button>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" onClick={handleSubmit}>Save Experiment</Button>
            <Button type="button" variant="secondary" onClick={resetForm}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      {STATUS_OPTIONS.map((status) => (
        <div key={status}>
          <h2 className="text-xl font-bold mt-6 mb-2">{status} Experiments</h2>
          {experimentsByStatus[status]?.length === 0 ? (
            <p className="text-gray-500">None</p>
          ) : (
            <ul className="space-y-2">
              {experimentsByStatus[status].map((exp) => (
                <li key={exp.key} className="p-3 border rounded flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <strong>{exp.key}</strong> — Target: {exp.target}, Sample: {exp.sample}% | Variations: {exp.variations.map(v => v.name).join(", ")}
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <Button size="sm" onClick={() => startEdit(exp)}>Edit</Button>
                    <Button size="sm" onClick={() => handleDelete(exp.key)} variant="destructive">Delete</Button>
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
