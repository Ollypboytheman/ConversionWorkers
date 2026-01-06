import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import logo from "./logo.webp";

export default function ConversionKVAdmin() {
  const [experimentKey, setExperimentKey] = useState("");
  const [targetPage, setTargetPage] = useState("");
  const [sampleRate, setSampleRate] = useState("100");
  const [status, setStatus] = useState("Build");
  const [variations, setVariations] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [editing, setEditing] = useState(false);

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
      { name: "", split: "", type: "inject", code: "", isControl: false },
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
        redirectUrl: v.redirectUrl,
        rewriteUrl: v.rewriteUrl,
        js: v.js,
        css: v.css,
        html: v.html,
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
      const res = await fetch(
        `/api/save-experiments?key=${encodeURIComponent(key)}`,
        {
          method: "DELETE",
        }
      );
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

  // ---------------------------------------------------------------------------
  // UI styling (token-driven + Conversion Workers green)
  // NOTE: This assumes your app root has className="dark".
  // Even if shadcn tokens aren't perfect yet, these classNames force dark panels.
  // ---------------------------------------------------------------------------
  const pageWrap =
    "max-w-5xl mx-auto px-4 py-10 space-y-8 text-foreground";
  const title =
    "text-3xl md:text-4xl font-extrabold tracking-tight text-foreground";

  const cardClass =
    "bg-card text-card-foreground border border-border shadow-[0_20px_60px_rgba(0,0,0,.35)]";

  const label =
    "text-sm font-semibold text-foreground/90";

  const help =
    "text-xs text-muted-foreground";

  const selectClass =
    "w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-foreground outline-none " +
    "focus:ring-2 focus:ring-ring focus:border-ring";

  const sectionBox =
    "rounded-xl border border-border bg-muted/20 p-4";

  const variationBox =
    "rounded-xl border border-border bg-muted/15 p-4 space-y-3";

  const primaryBtn =
    "bg-primary text-primary-foreground hover:bg-primary/90";

  const secondaryBtn =
    "bg-secondary text-secondary-foreground hover:bg-secondary/80";

  const ghostBtn =
    "bg-muted/20 text-foreground hover:bg-muted/30 border border-border";

  const codeBadge =
    "inline-flex items-center rounded-md border border-border bg-muted/25 px-2 py-0.5 text-xs text-foreground/80";

  return (
    <div className={pageWrap}>
      <div className="space-y-2">
        <h1 className={title}>Conversion Workers — KV Admin</h1>
        <p className="text-muted-foreground">
          Edge-first experimentation config. Dark UI + Conversion Workers green.
        </p>
      </div>

      {/* Editor */}
      <Card className={cardClass}>
        <CardContent className="space-y-5 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className={label}>Experiment Name</div>
              <Input
                placeholder="e.g. homepage_hero_copy_v1"
                value={experimentKey}
                onChange={(e) => setExperimentKey(e.target.value)}
                disabled={editing}
                className="bg-muted/30 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              />
              <div className={help}>
                {editing ? "Key locked while editing." : "Used as the KV key."}
              </div>
            </div>

            <div className="space-y-2">
              <div className={label}>Target Page</div>
              <Input
                placeholder="e.g. /homepage"
                value={targetPage}
                onChange={(e) => setTargetPage(e.target.value)}
                className="bg-muted/30 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              />
              <div className={help}>Path match (keep it simple and predictable).</div>
            </div>

            <div className="space-y-2">
              <div className={label}>Sample %</div>
              <Input
                type="number"
                placeholder="100"
                value={sampleRate}
                onChange={(e) => setSampleRate(e.target.value)}
                min={1}
                max={100}
                className="bg-muted/30 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              />
              <div className={help}>Traffic eligible for the experiment.</div>
            </div>

            <div className="space-y-2">
              <div className={label}>Status</div>
              <select
                className={selectClass}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Build">Build</option>
                <option value="QA">QA</option>
                <option value="Live">Live</option>
                <option value="Completed">Completed</option>
              </select>
              <div className={help}>Used to group experiments in the UI.</div>
            </div>
          </div>

          {/* Variations */}
          <div className={sectionBox}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Variations
                </h2>
                <div className={help}>
                  Splits must total <span className={codeBadge}>100</span>.
                  Control should remain <span className={codeBadge}>type=none</span>.
                </div>
              </div>

              <Button
                type="button"
                onClick={addVariation}
                className={primaryBtn}
              >
                Add Variation
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {variations.map((v, i) => (
                <div key={i} className={variationBox}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <div className={label}>Name</div>
                      <Input
                        placeholder="e.g. var_a"
                        value={v.name}
                        onChange={(e) =>
                          updateVariation(i, "name", e.target.value)
                        }
                        disabled={v.isControl}
                        className="bg-muted/30 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                      />
                      {v.isControl && (
                        <div className={help}>Control name is fixed.</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className={label}>Split %</div>
                      <Input
                        type="number"
                        placeholder="e.g. 50"
                        value={v.split}
                        onChange={(e) =>
                          updateVariation(i, "split", e.target.value)
                        }
                        className="bg-muted/30 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className={label}>Type</div>
                      <select
                        className={selectClass}
                        value={v.type}
                        onChange={(e) =>
                          updateVariation(i, "type", e.target.value)
                        }
                      >
                        <option value="none">None</option>
                        <option value="inject">Inject (JS/CSS/HTML)</option>
                        <option value="rewrite">Rewrite</option>
                        <option value="redirect">Redirect</option>
                      </select>
                    </div>
                  </div>

                  {v.type === "inject" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <div className={label}>JS</div>
                        <Textarea
                          placeholder="JavaScript to inject"
                          value={v.js || ""}
                          onChange={(e) =>
                            updateVariation(i, "js", e.target.value)
                          }
                          className="min-h-40 bg-muted/25 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className={label}>CSS</div>
                        <Textarea
                          placeholder="CSS to inject"
                          value={v.css || ""}
                          onChange={(e) =>
                            updateVariation(i, "css", e.target.value)
                          }
                          className="min-h-40 bg-muted/25 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className={label}>HTML</div>
                        <Textarea
                          placeholder="HTML to inject"
                          value={v.html || ""}
                          onChange={(e) =>
                            updateVariation(i, "html", e.target.value)
                          }
                          className="min-h-40 bg-muted/25 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {v.type === "redirect" && (
                    <div className="space-y-2">
                      <div className={label}>Redirect URL</div>
                      <Input
                        placeholder="https://example.com/new-landing"
                        value={v.redirectUrl || ""}
                        onChange={(e) =>
                          updateVariation(i, "redirectUrl", e.target.value)
                        }
                        className="bg-muted/30 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                      />
                    </div>
                  )}

                  {v.type === "rewrite" && (
                    <div className="space-y-2">
                      <div className={label}>Rewrite URL (internal)</div>
                      <Input
                        placeholder="/some/other/page"
                        value={v.rewriteUrl || ""}
                        onChange={(e) =>
                          updateVariation(i, "rewriteUrl", e.target.value)
                        }
                        className="bg-muted/30 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4 flex-wrap">
              <Button type="button" onClick={handleSubmit} className={primaryBtn}>
                {editing ? "Update" : "Save"} Experiment
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={resetForm}
                className={secondaryBtn}
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buckets */}
      {Object.entries(bucketed).map(([bucket, items]) => (
        <div key={bucket} className="space-y-3">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-foreground">{bucket}</h2>
            <div className="text-sm text-muted-foreground">
              {items.length} experiment{items.length === 1 ? "" : "s"}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="text-muted-foreground">None</div>
          ) : (
            <ul className="space-y-4">
              {items.map((exp) => (
                <li
                  key={exp.key}
                  className="rounded-xl border border-border bg-card text-card-foreground p-4"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <div className="font-bold text-lg">{exp.key}</div>
                      <div className="text-sm text-muted-foreground">
                        Target: <span className={codeBadge}>{exp.target}</span>{" "}
                        <span className="mx-2">•</span>
                        Sample: <span className={codeBadge}>{exp.sample}%</span>{" "}
                        <span className="mx-2">•</span>
                        Status: <span className={codeBadge}>{exp.status}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEdit(exp)}
                        className={ghostBtn}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDelete(exp.key)}
                        variant="destructive"
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <strong className="block mb-2 text-sm text-foreground/90">
                      Variations
                    </strong>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {exp.variations.map((v, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-muted/15 p-3"
                        >
                          <div className="font-medium">{v.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Split: {v.split}%{" "}
                            <span className="mx-1">•</span>
                            Type: {v.type || "none"}
                          </div>
                        </div>
                      ))}
                    </div>
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
