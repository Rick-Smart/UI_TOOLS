import Tooltip from "../../Tooltip";
import "./TriageQuestionList.css";

function TriageQuestionList({ questions, answers, onAnswerChange }) {
  return (
    <div className="triage-question-list input-grid">
      {questions.map((question) => (
        <label key={question.key} className="checkbox-row">
          <input
            type="checkbox"
            checked={Boolean(answers[question.key])}
            onChange={(event) =>
              onAnswerChange(question.key, event.target.checked)
            }
          />
          <span>
            {question.label}
            {question.tooltip ? <Tooltip text={question.tooltip} /> : null}
          </span>
        </label>
      ))}
    </div>
  );
}

export default TriageQuestionList;
