
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

  // Load existing experiments (mocked here for now)
  useEffect(() => {
    const storedExperiments = localStorage.getItem("experiments");
    if (storedExperiments) {
      setExperiments(JSON.parse(storedExperiments));
    }
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
      {
        name: "",
        split: "",
        type: "",
        code: "",
        isControl: false,
      },
    ]);
  };

  const updateVariation = (index, field, value) => {
    const updated = [...variations];
    updated[index][field] = value;
    setVariations(updated);
  };

  const resetForm = () => {
    setExperimentKey("");
    setTargetPage("");
    setSampleRate("100");
    setVariations([
      {
        name: "control",
        split: "",
        type: "none",
        code: "",
        isControl: true,
      },
    ]);
  };

  const handleSubmit = async () => {
  const totalSplit = variations.reduce(
    (acc, curr) => acc + parseFloat(curr.split || 0),
    0
  );

  if (totalSplit !== 100) {
    alert("Total split % for all variations must equal 100");
    return;
  }

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
    const res = await fetch(
      `https://conversion-kv-api.YOUR-SUBDOMAIN.workers.dev/?key=${encodeURIComponent(
        experimentKey
      )}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to save experiment to KV");
    }

    console.log("Saved to KV:", payload);

    // Optionally update local list (just for display purposes)
    const updated = [
      ...experiments.filter((e) => e.key !== experimentKey),
      payload,
    ];
    setExperiments(updated);
    resetForm();
  } catch (err) {
    alert("Error saving experiment: " + err.message);
  }
};


    if (totalSplit !== 100) {
      alert("Total split % for all variations must equal 100");
      return;
    }

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

    console.log("Experiment JSON:", JSON.stringify(payload, null, 2));
    const updated = [...experiments.filter((e) => e.key !== experimentKey), payload];
    setExperiments(updated);
    localStorage.setItem("experiments", JSON.stringify(updated));
    resetForm();
  };

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">Conversion Workers – KV Admin</h1>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <Input
            placeholder="Experiment Key (e.g. homepage_v1_v2)"
            value={experimentKey}
            onChange={(e) => setExperimentKey(e.target.value)}
          />

          <Input
            placeholder="Target Page URL or Regex (e.g. / or ^/category/)"
            value={targetPage}
            onChange={(e) => setTargetPage(e.target.value)}
          />

          <Input
            type="number"
            placeholder="Sample % of traffic (e.g. 100 for all traffic)"
            value={sampleRate}
            onChange={(e) => setSampleRate(e.target.value)}
          />

          <div className="space-y-6">
            {variations.map((variation, index) => (
              <div key={index} className="border-t pt-4">
                <h2 className="font-semibold">
                  {variation.isControl ? "Control (default)" : `Variation ${index}`}
                </h2>
                <Input
                  placeholder="Name"
                  value={variation.name}
                  onChange={(e) =>
                    updateVariation(index, "name", e.target.value)
                  }
                  disabled={variation.isControl}
                />
                <Input
                  type="number"
                  placeholder="% Split"
                  value={variation.split}
                  onChange={(e) =>
                    updateVariation(index, "split", e.target.value)
                  }
                />
                {!variation.isControl && (
                  <>
                    <Input
                      placeholder="Execution Type (e.g. redirect, css, js, html)"
                      value={variation.type}
                      onChange={(e) =>
                        updateVariation(index, "type", e.target.value)
                      }
                    />
                    <Textarea
                      placeholder="Code for this variation"
                      value={variation.code}
                      onChange={(e) =>
                        updateVariation(index, "code", e.target.value)
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

      <Card>
        <CardContent className="pt-6 space-y-2">
          <h2 className="text-lg font-semibold">All Experiment Keys</h2>
          {experiments.length === 0 ? (
            <p className="text-muted-foreground">No experiments saved yet.</p>
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
