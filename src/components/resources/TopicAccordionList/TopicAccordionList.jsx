import "./TopicAccordionList.css";
import AppButton from "../../ui/AppButton/AppButton";

function TopicAccordionList({
  groups,
  activeTopic,
  onToggleTopic,
  renderGroupContent,
  emptyText,
}) {
  if (!groups.length) {
    return <p className="muted">{emptyText}</p>;
  }

  return (
    <div className="topic-accordion-list stack">
      {groups.map((topicGroup) => {
        const isOpen = topicGroup.topic === activeTopic;

        return (
          <section key={topicGroup.topic} className="result stack">
            <AppButton
              type="button"
              className="accordion-trigger"
              onClick={() => onToggleTopic(topicGroup.topic)}
              aria-expanded={isOpen}
            >
              <span>{topicGroup.topic}</span>
              <span className="muted">{topicGroup.resources.length}</span>
            </AppButton>
            {isOpen ? renderGroupContent(topicGroup) : null}
          </section>
        );
      })}
    </div>
  );
}

export default TopicAccordionList;
