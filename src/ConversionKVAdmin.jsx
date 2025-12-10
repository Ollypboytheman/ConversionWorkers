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

  useEffect(() => {
    const stored = localStorage.getItem("experiments");
    if (stored) setExperiments(JSON.parse(stored));
  }, []);

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
        { key: experimentKey, ...payload },
      ];
      setExperiments(updated);
      localStorage.setItem("experiments", JSON.stringify(updated));
      resetForm();
      alert("Experiment saved to KV!");
    } catch (err) {
      alert("Error saving experiment:\n" + err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold mb-2">Conversion Workers – KV Admin</h1>
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
            <option value="Build">Build</option>
            <option value="QA">QA</option>
            <option value="Live">Live</option>
            <option value="Completed">Completed</option>
          </select>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Variations</h2>
            {variations.map((v, i) => (
              <div
                key={i}
                className="border p-2 mb-2 rounded flex flex-col gap-2 bg-gray-50"
              >
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

          <div className="flex gap-2 pt-2">
            <Button type="button" onClick={handleSubmit}>
              Save Experiment
            </Button>
            <Button type="button" onClick={resetForm} variant="secondary">
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold">Saved Experiments (local storage)</h2>
        {experiments.length === 0 ? (
          <div>No experiments saved yet.</div>
        ) : (
          <ul>
            {experiments.map((exp, idx) => (
              <li key={idx} className="p-2 border-b">
                <strong>{exp.key}</strong> &mdash; Target: {exp.target}, Sample: {exp.sample}% | Status: {exp.status} | Variations: {exp.variations.map((v) => v.name).join(", ")}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
