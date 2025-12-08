import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ConversionKVAdmin() {
  const [experimentKey, setExperimentKey] = useState("");
  const [targetPage, setTargetPage] = useState("");
  const [sampleRate, setSampleRate] = useState("100");
  const [variations, setVariations] = useState([]);
  const [experiments, setExperiments] = useState([]);

  // Load saved experiments (local display only)
  useEffect(() => {
    const stored = localStorage.getItem("experiments");
    if (stored) setExperiments(JSON.parse(stored));
  }, []);

  // Initialise control group
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
    setVariations([
      { name: "control", split: "", type: "none", code: "", isControl: true },
    ]);
  };

  const handleSubmit = async () => {
    // Validate split % = 100
    const total = variations.reduce(
      (acc, v) => acc + parseFloat(v.split || 0),
      0
    );

    if (total !== 100) {
      alert("Total variation split % must equal 100%");
      return;
    }

    // Build object to store
    const payload = {
      key: experimentKey,
      target: targetPage,
      sample: parseFloat(sampleRate),
      variations: variations.map((v) => ({
        name: v.name,
        split: parseFloat(v.split || 0),
        type: v.type,
        code: v.code,
      })),
    };

    try {
      // 🔥 CALL YOUR PAGES FUNCTION
      const res = await fetch(
        `/api/save-experiments?key=${encodeURIComponent(experimentKey)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Failed to save experiment to KV");

      console.log("Saved to KV:", payload);

      // Update local UI list only
      const updated = [
        ...experiments.filter((e) => e.key !== experimentKey),
        payload,
      ];
      setExperiments(updated);
      localStorage.setItem("experiments", JSON.stringify(updated));

      resetForm();
    } catch (err) {
      alert("Error saving experiment: " + err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">Conversion Workers – KV Admin</h1>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <Input
            placeholder="Experiment Key (e.g. homepage_test_v1)"
            value={experimentKey}
            onChange={(e) => setExperimentKey(e.target.value)}
          />

          <Input
            placeholder="Target Page (URL or regex)"
            value={targetPage}
            onChange={(e) => setTargetPage(e.target.value)}
          />

          <Input
            type="number"
            placeholder="Sample % (default 100)"
            value={sampleRate}
            onChange={(e) => setSampleRate(e.target.value)}
          />

          {/* Variations */}
          <div className="space-y-6">
            {variations.map((v, i) => (
              <div key={i} className="border-t pt-4">
                <h2 className="font-semibold">
                  {v.isControl ? "Control (default)" : `Variation ${i}`}
                </h2>

                <Input
                  placeholder="Name"
                  value={v.name}
                  disabled={v.isControl}
                  onChange={(e) =>
                    updateVariation(i, "name", e.target.value)
                  }
                />

                <Input
                  type="number"
                  placeholder="% Split"
                  value={v.split}
                  onChange={(e) =>
                    updateVariation(i, "split", e.target.value)
                  }
                />

                {!v.isControl && (
                  <>
                    <Input
                      placeholder="Type (redirect, css, js, html)"
                      value={v.type}
                      onChange={(e) =>
                        updateVariation(i, "type", e.target.value)
                      }
                    />

                    <Textarea
                      placeholder="Code to execute"
                      value={v.code}
                      onChange={(e) =>
                        updateVariation(i, "code", e.target.value)
                      }
                    />
                  </>
                )}
              </div>
            ))}

            <Button onClick={addVariation} variant="secondary">
              + Add Variation
            </Button>
          </div>

          <Button onClick={handleSubmit} className="w-full">
            Save Experiment
          </Button>
        </CardContent>
      </Card>

      {/* Display Saved Experiments */}
      <Card>
        <CardContent className="pt-6 space-y-2">
          <h2 className="text-lg font-semibold">Existing Experiments</h2>

          {experiments.length === 0 ? (
            <p className="text-muted-foreground">No experiments yet.</p>
          ) : (
            <ul className="list-disc list-inside">
              {experiments.map((exp, idx) => (
                <li key={idx}>{exp.key}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
