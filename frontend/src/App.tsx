import { useState } from "react";
import type { FormEvent } from "react";

import "./App.css";

type EstimateForm = {
  platform: string;
  followerCount: string;
  averageViews: string;
  videoCount: string;
  usageRights: boolean;
  exclusivity: boolean;
};

type EstimateResponse = {
  estimatedViews: number;
  estimatedLow: number;
  estimatedHigh: number;
  explanation: string[];
  viewsSource: "averageViews" | "followerCount";
};

type FieldErrors = Partial<Record<"followerCount" | "averageViews" | "videoCount", string>>;

const initialForm: EstimateForm = {
  platform: "instagram",
  followerCount: "25000",
  averageViews: "",
  videoCount: "1",
  usageRights: false,
  exclusivity: false,
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function isPositiveWholeNumber(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue === "") {
    return false;
  }

  const numericValue = Number(trimmedValue);

  return Number.isInteger(numericValue) && numericValue > 0;
}

function validateForm(formValues: EstimateForm) {
  const nextErrors: FieldErrors = {};

  if (!isPositiveWholeNumber(formValues.followerCount)) {
    nextErrors.followerCount = "Follower count must be at least 1.";
  }

  if (formValues.averageViews.trim() !== "" && !isPositiveWholeNumber(formValues.averageViews)) {
    nextErrors.averageViews = "Average views must be at least 1 when provided.";
  }

  if (!isPositiveWholeNumber(formValues.videoCount)) {
    nextErrors.videoCount = "Promotional videos must be at least 1.";
  }

  return nextErrors;
}

function App() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<EstimateResponse | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  function updateField(field: keyof EstimateForm, value: string | boolean) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    if (
      field === "followerCount" ||
      field === "averageViews" ||
      field === "videoCount"
    ) {
      setFieldErrors((currentErrors) => {
        if (!currentErrors[field]) {
          return currentErrors;
        }

        const nextErrors = { ...currentErrors };
        delete nextErrors[field];
        return nextErrors;
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(form);
    setFieldErrors(validationErrors);

    setError("");
    setResult(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsLoading(true);

    const averageViews =
      form.averageViews.trim() === "" ? undefined : Number(form.averageViews);

    const payload = {
      platform: form.platform,
      followerCount: Number(form.followerCount),
      videoCount: Number(form.videoCount),
      usageRights: form.usageRights,
      exclusivity: form.exclusivity,
    };

    const requestBody =
      averageViews === undefined
        ? payload
        : {
            ...payload,
            averageViews,
          };

    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseBody = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof responseBody.error === "string"
            ? responseBody.error
            : "Could not calculate the estimate.",
        );
      }

      setResult(responseBody);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not calculate the estimate.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="page-heading">
        <p className="eyebrow">Restaurant campaign pricing</p>
        <h1>Influencer Rate Estimator</h1>
      </section>

      <section className="workspace">
        <form className="estimate-form" onSubmit={handleSubmit}>
          <label>
            <span>Platform</span>
            <select
              value={form.platform}
              onChange={(event) => updateField("platform", event.target.value)}
            >
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
            </select>
          </label>

          <label>
            <span>Follower count</span>
            <input
              aria-describedby="follower-count-error"
              aria-invalid={Boolean(fieldErrors.followerCount)}
              min="1"
              step="1"
              type="number"
              value={form.followerCount}
              onChange={(event) =>
                updateField("followerCount", event.target.value)
              }
            />
            {fieldErrors.followerCount && (
              <p className="field-error" id="follower-count-error">
                {fieldErrors.followerCount}
              </p>
            )}
          </label>

          <label className="full-width">
            <span>Average views per video</span>
            <input
              aria-describedby="average-views-help average-views-error"
              aria-invalid={Boolean(fieldErrors.averageViews)}
              min="1"
              inputMode="numeric"
              step="1"
              type="number"
              placeholder="Optional"
              value={form.averageViews}
              onChange={(event) =>
                updateField("averageViews", event.target.value)
              }
            />
            <p className="field-help" id="average-views-help">
              Optional. Leave blank if you are not sure.
            </p>
            {fieldErrors.averageViews && (
              <p className="field-error" id="average-views-error">
                {fieldErrors.averageViews}
              </p>
            )}
          </label>

          <label>
            <span>Promotional videos</span>
            <input
              aria-describedby="video-count-error"
              aria-invalid={Boolean(fieldErrors.videoCount)}
              min="1"
              step="1"
              type="number"
              value={form.videoCount}
              onChange={(event) =>
                updateField("videoCount", event.target.value)
              }
            />
            {fieldErrors.videoCount && (
              <p className="field-error" id="video-count-error">
                {fieldErrors.videoCount}
              </p>
            )}
          </label>

          <div className="checkbox-row">
            <label className="checkbox-option">
              <input
                checked={form.usageRights}
                type="checkbox"
                onChange={(event) =>
                  updateField("usageRights", event.target.checked)
                }
              />
              <span className="checkbox-label">Usage rights</span>
            </label>

            <label className="checkbox-option">
              <input
                checked={form.exclusivity}
                type="checkbox"
                onChange={(event) =>
                  updateField("exclusivity", event.target.checked)
                }
              />
              <span className="checkbox-label">Exclusivity</span>
            </label>
          </div>

          <div className="form-actions">
            <button
              className="estimate-button"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Calculating..." : "Calculate Estimate"}
            </button>
          </div>
        </form>

        <section className="result-panel" aria-live="polite">
          <h2>Estimate result</h2>

          {error && <p className="error-message">{error}</p>}

          {!error && !result && <p className="empty-state">No estimate yet.</p>}

          {result && (
            <>
              <div className="estimate-range">
                <div className="range-card">
                  <span>Low</span>
                  <strong>{currencyFormatter.format(result.estimatedLow)}</strong>
                </div>
                <div className="range-card">
                  <span>High</span>
                  <strong>{currencyFormatter.format(result.estimatedHigh)}</strong>
                </div>
              </div>

              <div className="metric-row">
                <span>Views used for estimate</span>
                <strong>{result.estimatedViews.toLocaleString()}</strong>
              </div>

              <ol className="explanation-list">
                {result.explanation.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
