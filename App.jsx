import React, { useMemo, useState } from "react";
import sampleCsv from "../data/sample_sensor_data.csv?raw";

const featureLabels = {
  motor_temp_c: "Motor Temperature",
  vibration_g: "Vibration",
  current_a: "Current Draw",
  battery_voltage_v: "Battery Voltage",
  wheel_speed_rpm: "Wheel Speed",
  torque_nm: "Torque",
  operating_hours: "Operating Hours",
};

const featureImportance = [
  ["torque_nm", 0.22],
  ["vibration_g", 0.19],
  ["motor_temp_c", 0.16],
  ["current_a", 0.15],
  ["battery_voltage_v", 0.12],
  ["operating_hours", 0.1],
  ["wheel_speed_rpm", 0.06],
];

const initialReading = {
  motor_temp_c: 72,
  vibration_g: 1.4,
  current_a: 24,
  battery_voltage_v: 12.1,
  wheel_speed_rpm: 2800,
  torque_nm: 18,
  operating_hours: 210,
};

// converts the bundled csv text into row objects for the dashboard.
function parseCsv(csvText) {
  const [headerLine, ...lines] = csvText.trim().split("\n");
  const headers = headerLine.split(",").map((header) => header.trim());

  return lines.map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return headers.reduce((row, header, index) => {
      row[header] = Number(values[index]);
      return row;
    }, {});
  });
}

// keeps a value between a low and high limit.
function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

// turns sensor values into a risk probability that runs fully in the browser.
function scoreReading(reading) {
  let score = -4;
  score += (reading.motor_temp_c - 65) / 12;
  score += (reading.vibration_g - 1.2) * 1.4;
  score += (reading.current_a - 22) / 8;
  score += (12 - reading.battery_voltage_v) * 1.3;
  score += (reading.torque_nm - 16) / 7;
  score += (reading.operating_hours - 180) / 160;
  score += reading.wheel_speed_rpm > 3600 ? 0.25 : 0;
  return 1 / (1 + Math.exp(-score));
}

// calculates quick model-style stats from the sample dataset.
function getDatasetStats(rows) {
  const evaluated = rows.map((row) => ({
    actual: row.failure_risk,
    predicted: scoreReading(row) >= 0.5 ? 1 : 0,
  }));

  const total = evaluated.length;
  const correct = evaluated.filter((row) => row.actual === row.predicted).length;
  const truePositive = evaluated.filter((row) => row.actual === 1 && row.predicted === 1).length;
  const falsePositive = evaluated.filter((row) => row.actual === 0 && row.predicted === 1).length;
  const falseNegative = evaluated.filter((row) => row.actual === 1 && row.predicted === 0).length;
  const trueNegative = evaluated.filter((row) => row.actual === 0 && row.predicted === 0).length;

  const precision = truePositive / Math.max(truePositive + falsePositive, 1);
  const recall = truePositive / Math.max(truePositive + falseNegative, 1);
  const f1 = (2 * precision * recall) / Math.max(precision + recall, 0.001);

  return {
    accuracy: correct / total,
    precision,
    recall,
    f1,
    confusion: { trueNegative, falsePositive, falseNegative, truePositive },
  };
}

// formats a decimal score into a dashboard-friendly percentage.
function percent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

// renders a small metric card.
function MetricCard({ label, value }) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

// renders one sensor slider and keeps the parent reading updated.
function SensorSlider({ id, label, min, max, step, value, onChange }) {
  return (
    <label className="sensor-control">
      <span>
        {label}
        <b>{value}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(id, Number(event.target.value))}
      />
    </label>
  );
}

// renders the horizontal feature-importance chart.
function FeatureBars() {
  return (
    <div className="bars">
      {featureImportance.map(([feature, importance]) => (
        <div className="bar-row" key={feature}>
          <span>{featureLabels[feature]}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${importance * 100 * 3.8}%` }} />
          </div>
          <b>{importance.toFixed(2)}</b>
        </div>
      ))}
    </div>
  );
}

// renders the prediction panel for the current manual sensor reading.
function PredictionPanel({ reading }) {
  const probability = scoreReading(reading);
  const isRisky = probability >= 0.5;

  return (
    <section className="panel prediction-panel">
      <p className="section-kicker">live reading</p>
      <h2>{isRisky ? "elevated failure risk" : "normal operation"}</h2>
      <div className="risk-meter">
        <span style={{ width: `${clamp(probability * 100, 3, 100)}%` }} />
      </div>
      <strong className="risk-score">{percent(probability)}</strong>
      <p className="muted">
        {isRisky
          ? "Inspect the drivetrain, cooling, wiring, and recent driving logs before another hard run."
          : "The robot looks healthy for now, but the dashboard should still be used as a monitoring tool."}
      </p>
    </section>
  );
}

// renders the whole vercel-ready dashboard.
export default function App() {
  const rows = useMemo(() => parseCsv(sampleCsv), []);
  const stats = useMemo(() => getDatasetStats(rows), [rows]);
  const [reading, setReading] = useState(initialReading);

  // updates one slider value while keeping the rest of the reading.
  const updateReading = (id, value) => {
    setReading((current) => ({ ...current, [id]: value }));
  };

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Hardware Monitoring Demo</p>
          <h1>Robot Hardware Monitoring</h1>
          <p>
            A fast Vercel dashboard that turns simulated drivetrain sensor values into a
            failure-risk prediction.
          </p>
        </div>
        <div className="hero-stat">
          <span>Sample Rows</span>
          <strong>{rows.length}</strong>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard label="accuracy" value={percent(stats.accuracy)} />
        <MetricCard label="precision" value={percent(stats.precision)} />
        <MetricCard label="recall" value={percent(stats.recall)} />
        <MetricCard label="f1 score" value={percent(stats.f1)} />
      </section>

      <section className="dashboard-grid">
        <section className="panel">
          <p className="section-kicker">Model Signals</p>
          <h2>most important inputs</h2>
          <FeatureBars />
        </section>

        <section className="panel">
          <p className="section-kicker">Information Grid</p>
          <h2>Sample Dataset Check</h2>
          <div className="confusion-grid">
            <MetricCard label="true normal" value={stats.confusion.trueNegative} />
            <MetricCard label="false risk" value={stats.confusion.falsePositive} />
            <MetricCard label="missed risk" value={stats.confusion.falseNegative} />
            <MetricCard label="true risk" value={stats.confusion.truePositive} />
          </div>
        </section>
      </section>

      <section className="control-grid">
        <section className="panel">
          <p className="section-kicker">Manual Test</p>
          <h2>Adjust Sensor Values</h2>
          <SensorSlider id="motor_temp_c" label="Motor Temperature" min={25} max={115} step={1} value={reading.motor_temp_c} onChange={updateReading} />
          <SensorSlider id="vibration_g" label="Vibration" min={0.05} max={5} step={0.05} value={reading.vibration_g} onChange={updateReading} />
          <SensorSlider id="current_a" label="Current Draw" min={2} max={55} step={1} value={reading.current_a} onChange={updateReading} />
          <SensorSlider id="battery_voltage_v" label="Battery Voltage" min={9} max={13.2} step={0.1} value={reading.battery_voltage_v} onChange={updateReading} />
          <SensorSlider id="wheel_speed_rpm" label="Wheel Speed" min={150} max={5200} step={50} value={reading.wheel_speed_rpm} onChange={updateReading} />
          <SensorSlider id="torque_nm" label="Torque" min={1} max={48} step={1} value={reading.torque_nm} onChange={updateReading} />
          <SensorSlider id="operating_hours" label="Operating Hours" min={0} max={520} step={5} value={reading.operating_hours} onChange={updateReading} />
        </section>

        <PredictionPanel reading={reading} />
      </section>

      <section className="panel">
          <p className="section-kicker">Dataset Preview</p>
        <h2>First Six Generated Samples</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {Object.keys(rows[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 6).map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value, valueIndex) => (
                    <td key={valueIndex}>{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
