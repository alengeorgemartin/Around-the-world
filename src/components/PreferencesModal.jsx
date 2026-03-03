import { useState } from "react";
import api from "../utils/api";

const travelStyles = ["Adventure", "Relaxation", "Culture", "Leisure"];
const interestsList = [
  "Food",
  "Nature",
  "Temples",
  "Beaches",
  "Shopping",
  "Photography"
];
const budgets = ["Budget", "Moderate", "Luxury"];
const paces = ["Slow", "Balanced", "Fast"];

const PreferencesModal = ({ onClose, onSave, existing = {} }) => {
  const [travelStyle, setTravelStyle] = useState(existing.travelStyle || []);
  const [interests, setInterests] = useState(existing.interests || []);
  const [budget, setBudget] = useState(existing.budget || "");
  const [pace, setPace] = useState(existing.pace || "");
  const [saving, setSaving] = useState(false);

  // ✅ toggle helper (FIXED)
  const toggle = (value, state, setter) => {
    if (state.includes(value)) {
      setter(state.filter(v => v !== value));
    } else {
      setter([...state, value]);
    }
  };

  const savePreferences = async () => {
    // ✅ minimum validation
    if (interests.length === 0) {
      alert("Please select at least one interest");
      return;
    }

    setSaving(true);

    const data = {
      travelStyle,
      interests,
      budget,
      pace,
    };

    try {
      await api.put("/profile/preferences", data);
      onSave(data);
      onClose();
    } catch (err) {
      alert("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Help us personalize your trips</h2>

        {/* TRAVEL STYLE */}
        <h4>Travel Style</h4>
        <div className="chips">
          {travelStyles.map(t => (
            <span
              key={t}
              className={`chip ${travelStyle.includes(t) ? "active" : ""}`}
              onClick={() => toggle(t, travelStyle, setTravelStyle)}
            >
              {t}
            </span>
          ))}
        </div>

        {/* INTERESTS */}
        <h4>Interests</h4>
        <div className="chips">
          {interestsList.map(i => (
            <span
              key={i}
              className={`chip ${interests.includes(i) ? "active" : ""}`}
              onClick={() => toggle(i, interests, setInterests)}
            >
              {i}
            </span>
          ))}
        </div>

        {/* BUDGET */}
        <h4>Budget</h4>
        <select
          value={budget}
          onChange={e => setBudget(e.target.value)}
        >
          <option value="">Select budget</option>
          {budgets.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* PACE */}
        <h4>Travel Pace</h4>
        <select
          value={pace}
          onChange={e => setPace(e.target.value)}
        >
          <option value="">Select pace</option>
          {paces.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* ACTIONS */}
        <div className="modal-actions">
          <button
            className="btn-secondary"
            onClick={onClose}
          >
            Skip
          </button>

          <button
            className="btn-primary"
            onClick={savePreferences}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesModal;
