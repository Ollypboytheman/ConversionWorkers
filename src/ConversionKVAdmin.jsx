import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const VARIATION_TYPES = ["none", "js", "html", "css", "redirect", "rewrite"];
const STATUSES = ["Build", "QA", "Live", "Completed"];

export default function ConversionKVAdmin() {
  const [experiments, setExperiments] = useState({});
  const [experimentKey, setExperimentKey] = useState("");
  const [target, setTarget] = useState("");
  const [sample, setSample] = useState(100);
  const [status, setStatus] = useState("Build");
  const [variations, setVariations] = useState([
    { name: "control", split: 50, type: "none", code: "" },
    { name: "variation", split: 50, type: "none", code: "" },
  ]);

  useEffect(() => {
    fetch("/api/list-experiments")
      .then((res) => res.json())
      .then((data) => {
        const grouped = {};
        Object.entries(data).forEach(([key, exp]) => {
          const expData = typeof exp === "string" ? JSON.parse(exp) : exp;
          const group = expData.status || "Build";
          if (!grouped[group]) grouped[group] = [];
          grouped[group].push({ key, ...expData });
        });
        setExperiments(grouped);
      });
  }, []);

  const handleVariationChange = (index, field, value) => {
    const updated = [...variations];
    updated[index][field] = field === "split" ? parseInt(value, 10) : value;
    setVariations(updated);
  };

  const addVariation = () => {
    setVariations([
      ...variations,
      { name: "", split: 0, type: "none", code: "" },
    ]);
  };

  const resetForm = () => {
    setExperimentKey("");
    setTarget("");
    setSample(100);
    setStatus("Build");
    setVariations([
      { name: "control", split: 50, type: "none", code: "" },
      { name: "variation", split: 50, type: "none", code: "" },
    ]);
  };

  const editExperiment = (exp) => {
    setExperimentKey(exp.key);
    setTarget(exp.target);
    setSample(exp.sample);
    setStatus(exp.status || "Build");
    setVariations(exp.variations);
  };

  const saveExperiment = () => {
    if (!experimentKey) {
      alert("Missing experiment name");
      return;
    }

    const payload = {
      target,
      sample,
      status,
      variations,
    };

    fetch(`/api/save-experiments?key=${encodeURIComponent(experimentKey)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("KV Save failed");
        return res.text();
      })
      .then(() => location.reload())
      .catch((err) => alert("Error saving experiment:\n" + err.message));
  };

  const deleteExperiment = (key) => {
    if (!confirm("Are you sure you want to delete this experiment?")) return;
    fetch(`/api/save-experiments?key=${encodeURIComponent(key)}`, {
      method: "DELETE",
    })
      .then(() => location.reload())
      .catch((err) => alert("Error deleting experiment:\n" + err.message));
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold">Conversion Workers – KV Admin</h1>

      <Card>
        <CardContent className="space-y-4 p-4">
          <Input
            placeholder="Experiment Name"
            value={experimentKey}
            onChange={(e) => setExperimentKey(e.target.value)}
          />
          <Input
            placeholder="Target Page (e.g. /homepage)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <Input
            placeholder="Sample %"
            type="number"
            value={sample}
            onChange={(e) => setSample(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <h2 className="text-xl font-semibold">Variations</h2>
          {variations.map((v, i) => (
            <div key={i} className="grid grid-cols-4 gap-2">
              <Input
                value={v.name}
                onChange={(e) => handleVariationChange(i, "name", e.target.value)}
                placeholder="Name"
              />
              <Input
                value={v.split}
                type="number"
                onChange={(e) => handleVariationChange(i, "split", e.target.value)}
                placeholder="Split %"
              />
              <select
                value={v.type}
                onChange={(e) => handleVariationChange(i, "type", e.target.value)}
              >
                {VARIATION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <Textarea
                value={v.code}
                onChange={(e) => handleVariationChange(i, "code", e.target.value)}
                placeholder="Code"
              />
            </div>
          ))}

          <div className="flex gap-2">
            <Button onClick={addVariation}>Add Variation</Button>
            <Button onClick={saveExperiment}>Save Experiment</Button>
            <Button variant="outline" onClick={resetForm}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      {STATUSES.map((group) => (
        <div key={group} className="space-y-2">
          <h2 className="text-2xl font-bold mt-4">{group} Experiments</h2>
          {(experiments[group] || []).map((exp) => (
            <Card key={exp.key} className="p-2">
              <CardContent>
                <div className="flex justify-between">
                  <div>
                    <strong>{exp.key}</strong>
                    <p className="text-sm text-muted-foreground">
                      Target: {exp.target} | Sample: {exp.sample}% | Status: {exp.status}
                    </p>
                    <p className="text-sm">
                      Variations: {exp.variations.map((v) => v.name).join(", ")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => editExperiment(exp)}>Edit</Button>
                    <Button variant="destructive" onClick={() => deleteExperiment(exp.key)}>Delete</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
