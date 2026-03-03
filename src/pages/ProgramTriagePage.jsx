import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageSection from "../components/layout/PageSection";
import Tooltip from "../components/Tooltip";
import TriageQuestionList from "../components/programTriage/TriageQuestionList/TriageQuestionList";
import TriageRecommendations from "../components/programTriage/TriageRecommendations/TriageRecommendations";
import { copyText } from "../utils/copyText";
import { addInteractionMemory } from "../utils/interactionMemory";

const TRIAGE_QUESTIONS = [
  {
    key: "federalEmployee",
    label: "Claimant last worked in federal civilian employment",
    tooltip: "Select for former federal civilian workers (UCFE screening).",
  },
  {
    key: "exMilitaryOrNoaa",
    label: "Claimant separated from military service or NOAA",
    tooltip:
      "Select for former service member/NOAA separation (UCX screening).",
  },
  {
    key: "multiStateWages",
    label: "Wages earned in multiple states",
    tooltip:
      "Select when claimant indicates wages in Arizona and at least one other state.",
  },
  {
    key: "approvedTraining",
    label: "Currently in potentially approved training",
  },
  {
    key: "sharedWork",
    label: "Employer has approved Shared Work plan",
  },
  {
    key: "workersCompInjury",
    label: "Work-related injury/disability with workers compensation history",
  },
  {
    key: "laborDispute",
    label: "Strike/lockout labor dispute at worksite",
  },
  {
    key: "disasterDeclared",
    label: "Claim connected to federally declared disaster",
    tooltip:
      "Use only when the unemployment reason is linked to a declared disaster event.",
  },
  {
    key: "tradeImpacted",
    label: "Job loss tied to import/outsourcing trade impacts",
  },
];

function ProgramTriagePage() {
  const [searchParams] = useSearchParams();
  const [answers, setAnswers] = useState(() => {
    const preset = searchParams.get("preset");
    const defaults = {
      federalEmployee: false,
      exMilitaryOrNoaa: false,
      multiStateWages: false,
      approvedTraining: false,
      sharedWork: false,
      workersCompInjury: false,
      laborDispute: false,
      disasterDeclared: false,
      tradeImpacted: false,
    };

    if (preset === "federal-military") {
      return {
        ...defaults,
        federalEmployee: true,
        exMilitaryOrNoaa: true,
      };
    }

    if (preset === "disaster") {
      return {
        ...defaults,
        disasterDeclared: true,
      };
    }

    return defaults;
  });
  const [copyStatus, setCopyStatus] = useState("");

  function setAnswer(field, value) {
    setAnswers((current) => ({ ...current, [field]: value }));
  }

  const recommendations = useMemo(() => {
    const results = [];

    if (answers.federalEmployee) {
      results.push("UCFE (Unemployment Insurance for Federal Employees)");
    }
    if (answers.exMilitaryOrNoaa) {
      results.push("UCX (Ex-Military/NOAA)");
    }
    if (answers.multiStateWages) {
      results.push("Combined Wages claim");
    }
    if (answers.approvedTraining) {
      results.push("Approved Training review");
    }
    if (answers.sharedWork) {
      results.push("Shared Work (employer approved plan required)");
    }
    if (answers.workersCompInjury) {
      results.push("Alternate Base Period (Workers Compensation claim)");
    }
    if (answers.laborDispute) {
      results.push("Labor Dispute claim");
    }
    if (answers.disasterDeclared) {
      results.push("DUA (Disaster Unemployment Assistance)");
    }
    if (answers.tradeImpacted) {
      results.push("TRA (Trade Readjustment Allowance)");
    }

    if (!results.length) {
      results.push("Regular UI claim path");
    }

    return results;
  }, [answers]);

  async function handleCopySummary() {
    const summary = [
      "Program Triage Summary",
      ...recommendations.map((item) => `- ${item}`),
    ].join("\n");

    const copied = await copyText(summary);
    if (copied) {
      addInteractionMemory("Program Triage", summary);
    }
    setCopyStatus(copied ? "Summary copied." : "Copy unavailable.");
  }

  return (
    <PageSection
      title="Program Triage Wizard"
      description="Quick routing helper for the Arizona UI programs listed in UIB-1240A."
    >
      <p className="muted">
        Select all conditions that apply for the current caller.
        <Tooltip text="This is a routing helper. It does not replace policy determinations." />
      </p>

      <TriageQuestionList
        questions={TRIAGE_QUESTIONS}
        answers={answers}
        onAnswerChange={setAnswer}
      />

      <TriageRecommendations
        recommendations={recommendations}
        copyStatus={copyStatus}
        onCopySummary={handleCopySummary}
      />
    </PageSection>
  );
}

export default ProgramTriagePage;
